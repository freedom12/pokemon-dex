/**
 * 数据预处理脚本 - 多语言版
 * 为每种语言生成一套聚合 JSON
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

// ── 获取宝可梦图鉴 API 图片数据 ──
async function fetchZukanImages() {
  const CACHE = resolve(__dirname, "..", "public", "data", "_zukan_cache.json");
  if (existsSync(CACHE)) {
    console.log("Using cached zukan API data");
    return JSON.parse(readFileSync(CACHE, "utf-8"));
  }
  console.log("Fetching zukan API...");
  const res = await fetch(
    "https://zukan.pokemon.co.jp/zukan-api/api/search/?limit=2000&page=1",
  );
  const data = await res.json();
  writeFileSync(CACHE, JSON.stringify(data.results));
  console.log(`Fetched ${data.results.length} zukan entries`);
  return data.results;
}

const zukanList = await fetchZukanImages();

// 构建匹配映射: key → image_m
// key 格式: "{dexNum}_{formNo}_{gender}_{isDMax}"
const zukanImageMap = {};
// 特例: 4 个有性别差异形态的图片（打不算形态差异）需要特殊处理
const specialGenderForms = new Set([
  521, //高傲雉鸡
  592, //轻飘飘
  593, //胖嘟嘟
  668, //火炎狮
]);
// todo
const specialForms = new Set([
  678, //超能妙喵
  801, //玛机雅娜
  892, //武道熊师
]);
for (const z of zukanList) {
  const no = parseInt(z.no, 10);
  if (z.kyodai_flg === 1) {
    // 超极巨化: dexNum + formNo=0 + isDMax=1
    zukanImageMap[`${no}_0_0_1`] = z.image_m;
  } else if (z.sub === 0) {
    // 基础形态
    zukanImageMap[`${no}_0_0_0`] = z.image_m;
  } else if (!specialGenderForms.has(no)) {
    // 其他形态: sub 对应 formNo
    zukanImageMap[`${no}_${z.sub}_0_0`] = z.image_m;
  } else {
    // 雌性
    if (z.sub === 1) {
      zukanImageMap[`${no}_0_1_0`] = z.image_m;
    } else {
      zukanImageMap[`${no}_${z.sub-1}_0_0`] = z.image_m;
    }
  }
}
const MD = resolve(ROOT, "madatsubomi", "Master Data");
const TEXT_ROOT = resolve(ROOT, "megaturtle-text");
const OUT = resolve(__dirname, "..", "public", "data");

mkdirSync(OUT, { recursive: true });

const loadJson = (name) => JSON.parse(readFileSync(resolve(MD, name), "utf-8"));

// 语言配置: [id, 显示名, 文件夹名, 文件后缀]
const LANGS = [
  ["sch", "简体中文", "Chinese (Simplified)", "sch"],
  ["tch", "繁體中文", "Chinese (Traditional)", "tch"],
  ["usa", "English", "English", "usa"],
  ["jpn", "日本語(かな)", "Japanese (Kana)", "jpn"],
  ["jpn_kanji", "日本語(漢字)", "Japanese (Kanji)", "jpn_kanji"],
  ["kor", "한국어", "Korean", "kor"],
  ["fra", "Français", "French", "fra"],
  ["deu", "Deutsch", "German", "deu"],
  ["ita", "Italiano", "Italian", "ita"],
  ["esp", "Español", "Spanish (Spain)", "esp"],
  ["las", "Español (LA)", "Spanish (Latin America)", "las"],
];

// ── 解析文本文件 ──
function parseTexts(folder, suffix) {
  const filePath = resolve(TEXT_ROOT, folder, `msbt_${suffix}.txt`);
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, "utf-8");
  const map = {};
  let currentFile = "";
  const suffixPattern = new RegExp(
    `_${suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.msbt$`,
  );
  for (const line of raw.split(/\r?\n/)) {
    const fileMatch = line.match(/^Text File : (.+)$/);
    if (fileMatch) {
      currentFile = fileMatch[1].replace(suffixPattern, "");
      continue;
    }
    if (line.startsWith("~") || !line.trim()) continue;
    const idx = line.indexOf("\t");
    if (idx === -1) continue;
    map[`${currentFile}:${line.substring(0, idx)}`] = line.substring(idx + 1);
  }
  return map;
}

function makeTranslator(texts) {
  const byKey = {};
  for (const [fullKey, val] of Object.entries(texts)) {
    const ci = fullKey.indexOf(":");
    if (ci !== -1) {
      const bare = fullKey.substring(ci + 1);
      if (!byKey[bare]) byKey[bare] = val;
    }
  }
  return (msKey) => {
    if (!msKey) return "";
    if (texts[msKey]) return texts[msKey];
    if (byKey[msKey]) return byKey[msKey];
    return "";
  };
}

// ── 加载不依赖语言的原始数据 ──
const pokemonTypesRaw = loadJson("pokemonType.json");
const tokuseiRaw = loadJson("tokusei.json");
const temperRaw = loadJson("temper.json");
const abilityRaw = loadJson("ability.json");
const ballsRaw = loadJson("monsterBall.json");
const regionsRaw = loadJson("region.json");
const personalRaw = loadJson("personalGlobal.json");
const evoRaw = loadJson("evolutionPattern.json");
const dictMgmtRaw = loadJson("dictionaryManagement.json");
const softAppearRaw = loadJson("softwareAppear.json");
const ribbonRaw = loadJson("ribbon.json");
const wazaRaw = loadJson("waza.json");
const wazaCatRaw = loadJson("wazaCategory.json");
const dictRaw = loadJson("dictionary.json");
const nameRaw = loadJson("pokemonName.json");
const formRaw = loadJson("pokemonForm.json");
const pokemonImageRaw = loadJson("pokemonImage.json");

// 构建图片 ID → icon URL 映射
const IMG_BASE = "https://resource.pokemon-home.com/battledata/img/pokei128/";
const ZUKAN_IMG_PREFIX = "https://zukan.pokemon.co.jp/zukan-api/up/images/index/";
const imageMap = {};
const imageFemaleMap = {};
for (const pi of pokemonImageRaw) {
  if (pi.dicListImage) {
    const icon = pi.dicListImage.replace(/^cap/, "icon").replace(/_128$/, "");
    imageMap[pi.id] = `${IMG_BASE}${icon}.png`;
  }
  if (pi.dicListImageFemale) {
    const icon = pi.dicListImageFemale
      .replace(/^cap/, "icon")
      .replace(/_128$/, "");
    imageFemaleMap[pi.id] = `${IMG_BASE}${icon}.png`;
  }
}
const catRaw = loadJson("category.json");
const heightRaw = loadJson("height.json");
const weightRaw = loadJson("weight.json");
const descRaw = loadJson("descText.json");
const colorRaw = loadJson("color.json");
const planRaw = loadJson("plan.json");
const softRaw = loadJson("software.json");

const personalMap = {};
for (const p of personalRaw) personalMap[p.id] = p;
const evoMap = {};
for (const e of evoRaw) evoMap[e.id] = e;

// 奖章结构数据（不再单独输出到根目录，已按语言生成）

// ── 为每种语言生成数据 ──
for (const [langId, langName, folder, suffix] of LANGS) {
  const texts = parseTexts(folder, suffix);
  if (Object.keys(texts).length === 0) {
    console.log(`⚠ Skipping ${langId}: no text`);
    continue;
  }
  const t = makeTranslator(texts);
  const langOut = resolve(OUT, langId);
  mkdirSync(langOut, { recursive: true });

  // 属性
  const typeMap = {};
  for (const ty of pokemonTypesRaw) {
    typeMap[ty.id] = {
      id: ty.id,
      name: t(ty.msname) || ty.id,
      color: ty.color,
      image: ty.image,
      sort: ty.sort,
      weakTo: ty.mdTypes2_0 || [],
      resistTo: ty.mdTypes0_5 || [],
      immuneTo: ty.mdTypes0_0 || [],
    };
  }

  // 特性
  const tokuseiMap = {};
  for (const tk of tokuseiRaw) {
    tokuseiMap[tk.id] = { id: tk.id, name: t(tk.msname), desc: t(tk.mstext) };
  }

  // 性格
  const abMap = {};
  for (const ab of abilityRaw) abMap[ab.id] = t(ab.ms);
  const natures = temperRaw.map((pe) => {
    const rawDesc = t(pe.mstext);
    const desc = rawDesc.replace(/\[VAR [^\]]+\]/g, "").trim();
    return {
      id: pe.id,
      name: t(pe.ms),
      plus: abMap[pe.mdAbilityPlus] || "",
      minus: abMap[pe.mdAbilityMinus] || "",
      desc: desc || "",
    };
  });

  // 精灵球
  const balls = ballsRaw
    .map((b) => ({
      id: b.id,
      number: b.number,
      name: t(b.msText),
      sort: b.sort,
    }))
    .sort((a, b) => a.number - b.number);

  // 区域
  const regions = regionsRaw.map((r) => ({
    id: r.id,
    no: r.no,
    name: t(r.ms),
  }));

  // 招式
  const wcMap = {};
  for (const wc of wazaCatRaw) wcMap[wc.id] = t(wc.ms);
  const moves = wazaRaw.map((w) => ({
    id: w.id,
    name: t(w.msname),
    desc: t(w.mstext),
    type: w.mdPokemonType,
    typeName: typeMap[w.mdPokemonType]?.name || "",
    typeColor: typeMap[w.mdPokemonType]?.color || "#999",
    category: wcMap[w.mdWazaCategory] || "",
  }));

  // 名称/形态/分类/身高/体重/描述/颜色
  const nmMap = {};
  for (const n of nameRaw) nmMap[n.id] = t(n.msname);
  const fmMap = {};
  for (const f of formRaw) {
    const v = t(f.ms);
    fmMap[f.id] = v && v !== f.ms ? v : "";
  }
  const ctMap = {};
  for (const c of catRaw) ctMap[c.id] = t(c.msname);
  const htMap = {};
  for (const h of heightRaw) htMap[h.id] = t(h.ms);
  const wtMap = {};
  for (const w of weightRaw) wtMap[w.id] = t(w.ms);
  const clMap = {};
  for (const c of colorRaw) clMap[c.id] = t(c.ms);

  // 构建图鉴描述：直接从文本中扫描所有 zukan_comment_* 段落
  const zukanGames = [
    { file: "zukan_comment_x", prefix: "ZKN_X", digits: 3, label: "Pokémon X" },
    { file: "zukan_comment_y", prefix: "ZKN_Y", digits: 3, label: "Pokémon Y" },
    {
      file: "zukan_comment_alpha",
      prefix: "ZKN_ALPHA",
      digits: 3,
      label: "Pokémon Alpha Sapphire",
    },
    {
      file: "zukan_comment_omega",
      prefix: "ZKN_OMEGA",
      digits: 3,
      label: "Pokémon Omega Ruby",
    },
    {
      file: "zukan_comment_sun",
      prefix: "ZKN_SUN",
      digits: 3,
      label: "Pokémon Sun",
    },
    {
      file: "zukan_comment_moon",
      prefix: "ZKN_MOON",
      digits: 3,
      label: "Pokémon Moon",
    },
    {
      file: "zukan_comment_ultrasun",
      prefix: "ZKN_ULSUN",
      digits: 3,
      label: "Pokémon Ultra Sun",
    },
    {
      file: "zukan_comment_ultramoon",
      prefix: "ZKN_ULMOON",
      digits: 3,
      label: "Pokémon Ultra Moon",
    },
    {
      file: "zukan_comment_letsgo",
      prefix: "ZKN_LETSGO",
      digits: 3,
      label: "Pokémon Let's Go",
    },
    {
      file: "zukan_comment_sword",
      prefix: "ZKN_SWORD",
      digits: 3,
      label: "Pokémon Sword",
    },
    {
      file: "zukan_comment_shield",
      prefix: "ZKN_SHIELD",
      digits: 3,
      label: "Pokémon Shield",
    },
    {
      file: "zukan_comment_brilliantdiamond",
      prefix: "ZKN_DIAMOND",
      digits: 3,
      label: "Pokémon Brilliant Diamond",
    },
    {
      file: "zukan_comment_shiningpearl",
      prefix: "ZKN_PEARL",
      digits: 3,
      label: "Pokémon Shining Pearl",
    },
    {
      file: "zukan_comment_arceus",
      prefix: "ZKN_ARCEUS",
      digits: 3,
      label: "Pokémon Legends: Arceus",
    },
    {
      file: "zukan_comment_scarlet",
      prefix: "ZKN_SCARLET",
      digits: 4,
      label: "Pokémon Scarlet",
    },
    {
      file: "zukan_comment_violet",
      prefix: "ZKN_VIOLET",
      digits: 4,
      label: "Pokémon Violet",
    },
    {
      file: "zukan_comment_za",
      prefix: "ZKN_ZA",
      digits: 4,
      label: "Pokémon Legends Z-A",
    },
  ];
  // 尝试用 softwareName 本地化游戏名，找不到就用 label
  // 同一个 zukanCommentFile 可能对应多个游戏版本（如 letsgo 对应皮卡丘和伊布）
  const gameNameMap = {};
  const gameSoftIdsMap = {};
  for (const sf of softRaw) {
    if (sf.msZukanCommentFile) {
      const name = t(sf.msname);
      if (name) {
        if (gameNameMap[sf.msZukanCommentFile]) {
          if (!gameNameMap[sf.msZukanCommentFile].includes(name)) {
            gameNameMap[sf.msZukanCommentFile] += " / " + name;
          }
        } else {
          gameNameMap[sf.msZukanCommentFile] = name;
        }
      }
      if (!gameSoftIdsMap[sf.msZukanCommentFile])
        gameSoftIdsMap[sf.msZukanCommentFile] = [];
      gameSoftIdsMap[sf.msZukanCommentFile].push(sf.id);
    }
  }

  // 游戏 sids 全局去重索引（跨所有宝可梦共享）
  const gIndex = [];
  const gMap = {};
  function getGIdx(sids) {
    const key = sids.join(",");
    if (gMap[key] !== undefined) return gMap[key];
    gMap[key] = gIndex.length;
    gIndex.push(sids);
    return gIndex.length - 1;
  }

  function getZukanDescs(dexNum, formNo) {
    const descs = [];
    for (const g of zukanGames) {
      const dexStr = String(dexNum).padStart(g.digits, "0");
      const formStr = String(formNo).padStart(3, "0");
      const textKey = `${g.file}:${g.prefix}_${dexStr}_${formStr}`;
      const desc = t(textKey);
      if (desc && desc !== textKey) {
        descs.push([getGIdx(gameSoftIdsMap[g.file] || []), desc]);
      }
    }
    return descs;
  }

  // 宝可梦
  const pokemon = [];
  const pokemonExtras = {};
  for (const d of dictRaw) {
    const dexNum = d.dictionaryId;
    if (dexNum <= 0) continue;
    const psId = `PS${String(dexNum).padStart(4, "0")}${String(d.formNo || 0).padStart(3, "0")}`;
    const stats = personalMap[psId];
    const evo = evoMap[d.mdEvoPatId];
    let evoChain = [];
    let evoTemplate = "";
    if (evo?.mdPokemonImages?.length > 0) {
      evoTemplate = evo.templatePrefab || "";
      evoChain = evo.mdPokemonImages.map((img) => {
        const numPart = img.replace("DI", "").replace(/[A-Z]$/, "");
        return {
          dexNum: parseInt(numPart.substring(0, 4), 10),
          formNo: parseInt(numPart.substring(4), 10),
        };
      });
    }
    const zukanDescs = getZukanDescs(dexNum, d.formNo || 0);
    const icon = imageMap[d.mdPokemonImage] || "";
    const iconFemale = imageFemaleMap[d.mdPokemonImage] || "";
    const zukanKey = `${dexNum}_${d.formNo || 0}_0_${d.isDMax || 0}`;
    const image = zukanImageMap[zukanKey] || "";
    const zukanKeyFemale = `${dexNum}_${d.formNo || 0}_1_${d.isDMax || 0}`;
    const imageFemale = zukanImageMap[zukanKeyFemale] || "";
    // 仅在详情页使用的扩展数据单独收集
    const ext = {};
    if (image) ext.i = image.replace(ZUKAN_IMG_PREFIX, "").replace(/\.png$/, "");
    if (imageFemale) ext.if = imageFemale.replace(ZUKAN_IMG_PREFIX, "").replace(/\.png$/, "");
    if (zukanDescs.length > 0) ext.z = zukanDescs;
    if (Object.keys(ext).length) pokemonExtras[d.id] = ext;
    const entry = {
      id: d.id,
      n: dexNum,
      fn: d.formNo || 0,
      fg: d.formGender,
      name: nmMap[d.mdNameId] || `#${dexNum}`,
      types: (d.mdTypeIds || []).map((tid) =>
        typeMap[tid] ? [tid, typeMap[tid].name, typeMap[tid].color] : null
      ).filter(Boolean),
      ab: (d.mdTokuIds || []).map((tid) => tokuseiMap[tid]?.name).filter(Boolean),
    };
    if (icon) entry.icon = icon.replace(IMG_BASE, "");
    if (iconFemale) entry.icf = iconFemale.replace(IMG_BASE, "");
    if (fmMap[d.mdForm]) entry.form = fmMap[d.mdForm];
    if (ctMap[d.mdCateId]) entry.cat = ctMap[d.mdCateId];
    if (htMap[d.mdHeightId]) entry.ht = htMap[d.mdHeightId];
    if (wtMap[d.mdWeightId]) entry.wt = wtMap[d.mdWeightId];
    if (clMap[d.mdColor]) entry.col = clMap[d.mdColor];
    if (stats) entry.st = [stats.hp, stats.atk, stats.def, stats.spatk, stats.spdef, stats.agi];
    if (evoChain.length > 0) entry.evo = evoChain.map((e) => [e.dexNum, e.formNo]);
    if (evoTemplate) entry.evot = evoTemplate;
    if (d.isMega === 1) entry.mg = 1;
    if (d.isDMax === 1) entry.dm = 1;
    if (d.isInNumberSort === 1) entry.ns = 1;
    if (d.appearSoftwareAper?.length) entry.ag = d.appearSoftwareAper;
    pokemon.push(entry);
  }
  pokemon.sort((a, b) => a.n - b.n || a.fn - b.fn);

  // 计划/版本
  const plans = planRaw.map((p) => ({
    id: p.id,
    isFree: p.isFree === 1,
    name: t(p.msname),
    info: t(p.msinfo),
  }));
  const softwares = softRaw
    .filter((s) => s.msname)
    .map((s) => ({
      id: s.id,
      romId: s.romId,
      gen: s.gen,
      name: t(s.msname),
      region: t(s.msregion),
    }))
    .filter((s) => s.name && s.name !== s.id);
  // 图鉴列表
  // 构建 hostDicId → mdSoftwareIds 映射（子图鉴继承主图鉴的游戏ID）
  const dmById = {};
  for (const dm of dictMgmtRaw) dmById[dm.id] = dm;
  function getSoftwareIds(dm) {
    if (dm.mdSoftwareIds && dm.mdSoftwareIds.length > 0)
      return dm.mdSoftwareIds;
    if (dm.hostDicId && dmById[dm.hostDicId])
      return getSoftwareIds(dmById[dm.hostDicId]);
    return [];
  }
  const dexList = dictMgmtRaw
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((dm) => {
      const name = t(dm.msRegionDicName);
      const swFile = `dictionarySW${dm.dicMdName.replace("SW", "")}.json`;
      let entries = [];
      try {
        entries = loadJson(swFile);
      } catch {}
      const pokemonIds = entries.map((e) => e.mdDicId);
      const softwareIds = getSoftwareIds(dm);
      return { id: dm.id, name: name || dm.dicMdName, softwareIds, pokemonIds };
    })
    .filter((d) => d.pokemonIds.length > 0);
  const abilities = Object.values(tokuseiMap).filter((a) => a.name);
  const typeList = Object.values(typeMap).sort((a, b) => a.sort - b.sort);

  // 奖章（使用 ribbon_SV 文本，最完整）
  const ribbons = ribbonRaw
    .map((r) => {
      const idx = String(r.order).padStart(3, "0");
      const name = t(`ribbon_SV:mes_ribbon_name_${idx}`);
      const desc = t(`ribbon_SV:mes_ribbon_info_${idx}`);
      return {
        id: r.id,
        order: r.order,
        image: r.image_a,
        name: name || "",
        desc: desc || "",
      };
    })
    .sort((a, b) => a.order - b.order);

  // 道具（精灵球已有，加上完整道具名称列表）
  const itemNames = [];
  for (let i = 1; i <= 2000; i++) {
    const key = `itemname:ITEMNAME_${String(i).padStart(3, "0")}`;
    const name = t(key);
    if (name && name !== key) itemNames.push({ id: i, name });
  }

  writeFileSync(resolve(langOut, "pokemon.json"), JSON.stringify(pokemon));
  writeFileSync(resolve(langOut, "pokemon-descs.json"), JSON.stringify({ _g: gIndex, ...pokemonExtras }));
  writeFileSync(resolve(langOut, "types.json"), JSON.stringify(typeList));
  writeFileSync(resolve(langOut, "moves.json"), JSON.stringify(moves));
  writeFileSync(resolve(langOut, "natures.json"), JSON.stringify(natures));
  writeFileSync(resolve(langOut, "balls.json"), JSON.stringify(balls));
  writeFileSync(resolve(langOut, "regions.json"), JSON.stringify(regions));
  writeFileSync(resolve(langOut, "plans.json"), JSON.stringify(plans));
  writeFileSync(resolve(langOut, "softwares.json"), JSON.stringify(softwares));
  writeFileSync(resolve(langOut, "dexList.json"), JSON.stringify(dexList));
  writeFileSync(resolve(langOut, "abilities.json"), JSON.stringify(abilities));
  writeFileSync(resolve(langOut, "ribbons.json"), JSON.stringify(ribbons));
  writeFileSync(resolve(langOut, "items.json"), JSON.stringify(itemNames));

  console.log(
    `✅ ${langId} (${langName}): ${pokemon.length} pokémon, ${moves.length} moves, ${abilities.length} abilities`,
  );
}

// 语言列表元数据
const langMeta = LANGS.map(([id, name]) => ({ id, name }));
writeFileSync(resolve(OUT, "langs.json"), JSON.stringify(langMeta));

// 游戏组（用于详情页显示游戏可用性）
const gameGroups = softAppearRaw
  .filter((sa) => sa.appearTarget === 1)
  .sort((a, b) => a.appearTargetSort - b.appearTargetSort)
  .map((sa) => ({ id: sa.id, softwareIds: sa.mdSoftwares }));
writeFileSync(resolve(OUT, "gameGroups.json"), JSON.stringify(gameGroups));
console.log("✅ All done!");
