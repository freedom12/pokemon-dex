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


const specialZukanKeyMap = {
  DI0201000: "", //未知图腾
  DI0201001: "",
  DI0201002: "",
  DI0201003: "",
  DI0201004: "",
  DI0201005: "201_0",
  DI0201006: "",
  DI0201007: "",
  DI0201008: "",
  DI0201009: "",
  DI0201010: "",
  DI0201011: "",
  DI0201012: "",
  DI0201013: "",
  DI0201014: "",
  DI0201015: "",
  DI0201016: "",
  DI0201017: "",
  DI0201018: "",
  DI0201019: "",
  DI0201020: "",
  DI0201021: "",
  DI0201022: "",
  DI0201023: "",
  DI0201024: "",
  DI0201025: "",
  DI0201026: "",
  DI0201027: "",
  DI0658001: "658_0", //甲贺忍蛙
  DI0658002: "",
  DI0658003: "658_1",
  DI0666000: "", //彩粉蝶
  DI0666001: "",
  DI0666002: "",
  DI0666003: "",
  DI0666004: "",
  DI0666005: "",
  DI0666006: "666_0",
  DI0666007: "",
  DI0666008: "",
  DI0666009: "",
  DI0666010: "",
  DI0666011: "",
  DI0666012: "",
  DI0666013: "",
  DI0666014: "",
  DI0666015: "",
  DI0666016: "",
  DI0666017: "",
  DI0666018: "",
  DI0666019: "",
  DI0670001: "", //花叶蒂
  DI0670002: "",
  DI0670003: "",
  DI0670004: "",
  DI0670005: "670_1",
  DI0670006: "670_2",
  DI0678002: "678_2", //超能妙喵
  DI0678003: "678_2",
  DI0718004: "718_2", //基格尔德
  DI0718005: "718_3",
  DI0774007: "774_1", //小陨星
  DI0801001: "", //玛机雅娜
  DI0801002: "801_1",
  DI0801003: "",
  DI0849001G: "849_3", //颤弦蝾螈
  DI0869000: "869_0", //霜奶仙
  DI0869000k1: "",
  DI0869000k2: "",
  DI0869000k3: "",
  DI0869000k4: "",
  DI0869000k5: "",
  DI0869000k6: "",
  DI0869001: "",
  DI0869001k1: "",
  DI0869001k2: "",
  DI0869001k3: "",
  DI0869001k4: "",
  DI0869001k5: "",
  DI0869001k6: "",
  DI0869002: "",
  DI0869002k1: "",
  DI0869002k2: "",
  DI0869002k3: "",
  DI0869002k4: "",
  DI0869002k5: "",
  DI0869002k6: "",
  DI0869003: "",
  DI0869003k1: "",
  DI0869003k2: "",
  DI0869003k3: "",
  DI0869003k4: "",
  DI0869003k5: "",
  DI0869003k6: "",
  DI0869004: "",
  DI0869004k1: "",
  DI0869004k2: "",
  DI0869004k3: "",
  DI0869004k4: "",
  DI0869004k5: "",
  DI0869004k6: "",
  DI0869005: "",
  DI0869005k1: "",
  DI0869005k2: "",
  DI0869005k3: "",
  DI0869005k4: "",
  DI0869005k5: "",
  DI0869005k6: "",
  DI0869006: "",
  DI0869006k1: "",
  DI0869006k2: "",
  DI0869006k3: "",
  DI0869006k4: "",
  DI0869006k5: "",
  DI0869006k6: "",
  DI0869007: "",
  DI0869007k1: "",
  DI0869007k2: "",
  DI0869007k3: "",
  DI0869007k4: "",
  DI0869007k5: "",
  DI0869007k6: "",
  DI0869000G: "869_1",
  DI0892000G: "892_2", //武道熊师
  DI0892001G: "892_3",
};
// 构建匹配映射: key → image_m
// key 格式: "{dexNum}_{formNo}_{gender}_{isDMax}"
const zukanImageMap = {};
const zukanOrgImageMap = {};
// 特例: 4 个有性别差异形态的图片（打不算形态差异）需要特殊处理
const specialGenderForms = new Set([
  521, //高傲雉鸡
  592, //轻飘飘
  593, //胖嘟嘟
  668, //火炎狮
]);
for (const z of zukanList) {
  const no = parseInt(z.no, 10);
  zukanOrgImageMap[`${no}_${z.sub}`] = z.image_m;
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
      zukanImageMap[`${no}_${z.sub - 1}_0_0`] = z.image_m;
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
const ZUKAN_IMG_PREFIX =
  "https://zukan.pokemon.co.jp/zukan-api/up/images/index/";
const imageMap = {};
const imageFemaleMap = {};
for (const pi of pokemonImageRaw) {
  if (pi.dicListImage) {
    const icon = pi.dicListImage.replace(/^cap/, "icon").replace(/_128(_\d+)?$/, "");
    imageMap[pi.id] = `${IMG_BASE}${icon}.png`;
  }
  if (pi.dicListImageFemale) {
    const icon = pi.dicListImageFemale
      .replace(/^cap/, "icon")
      .replace(/_128(_\d+)?$/, "");
    imageFemaleMap[pi.id] = `${IMG_BASE}${icon}.png`;
  }
}
const catRaw = loadJson("category.json");
const heightRaw = loadJson("height.json");
const weightRaw = loadJson("weight.json");
const colorRaw = loadJson("color.json");
const softRaw = loadJson("software.json");

const personalMap = {};
for (const p of personalRaw) personalMap[p.id] = p;
const evoMap = {};
for (const e of evoRaw) evoMap[e.id] = e;

// 预计算形态变换白名单：若某个图鉴条目的同族有 mdFormChangeDics 限制，
// 则只保留明确列在 mdFormChangeDics 中的形态，其余剔除。
const formChangeAllowedIds = new Set();
const formChangeRestrictedDexNums = new Set();
for (const d of dictRaw) {
  if (d.mdFormChangeDics && d.mdFormChangeDics.length > 0) {
    formChangeRestrictedDexNums.add(d.dictionaryId);
    for (const id of d.mdFormChangeDics) formChangeAllowedIds.add(id);
  }
}

const typeConfig = pokemonTypesRaw.map((ty) => ({
  id: ty.id,
  color: ty.color,
  image: ty.image,
  sort: ty.sort,
  weakTo: ty.mdTypes2_0 || [],
  resistTo: ty.mdTypes0_5 || [],
  immuneTo: ty.mdTypes0_0 || [],
}));
const moveConfig = wazaRaw.map((w) => ({
  id: w.id,
  type: w.mdPokemonType,
  categoryId: w.mdWazaCategory || "",
}));

const dmById = {};
for (const dm of dictMgmtRaw) dmById[dm.id] = dm;
function getSoftwareIds(dm) {
  if (dm.mdSoftwareIds && dm.mdSoftwareIds.length > 0)
    return dm.mdSoftwareIds;
  if (dm.hostDicId && dmById[dm.hostDicId])
    return getSoftwareIds(dmById[dm.hostDicId]);
  return [];
}
const dexListConfig = dictMgmtRaw
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((dm) => {
    const pokemonIds = (
      (() => {
        try {
          return loadJson(`dictionarySW${dm.dicMdName.replace("SW", "")}.json`).map((e) => e.mdDicId);
        } catch {
          return [];
        }
      })()
    );
    const softwareIds = getSoftwareIds(dm);
    return { id: dm.id, softwareIds, pokemonIds };
  })
  .filter((d) => d.pokemonIds.length > 0);

const colorHexMap = Object.fromEntries(colorRaw.map((c) => [c.id, c.color]));
const pokemonStatic = dictRaw
  .filter((d) => d.dictionaryId > 0)
  .filter(
    (d) =>
      !(
        formChangeRestrictedDexNums.has(d.dictionaryId) &&
        !formChangeAllowedIds.has(d.id)
      ),
  )
  .map((d) => {
    const dexNum = d.dictionaryId;
    const psId = `PS${String(dexNum).padStart(4, '0')}${String(d.formNo || 0).padStart(3, '0')}`;
    const stats = personalMap[psId];
    const evo = evoMap[d.mdEvoPatId];
    let evoChain = [];
    let evoTemplate = '';
    if (evo?.mdPokemonImages?.length > 0) {
      evoTemplate = evo.templatePrefab || '';
      evoChain = evo.mdPokemonImages.map((img) => {
        const numPart = img.replace('DI', '').replace(/[A-Z]$/, '');
        return {
          dexNum: parseInt(numPart.substring(0, 4), 10),
          formNo: parseInt(numPart.substring(4), 10),
        };
      });
    }
    const icon = imageMap[d.mdPokemonImage] || '';
    const iconFemale = imageFemaleMap[d.mdPokemonImage] || '';
    const entry = {
      id: d.id,
      n: dexNum,
      fn: d.formNo || 0,
      fg: d.formGender,
      icon: icon ? icon.replace(IMG_BASE, '') : '',
      icf: iconFemale ? iconFemale.replace(IMG_BASE, '') : '',
      types: d.mdTypeIds || [],
      ab: d.mdTokuIds || [],
      kt: d.mdKata || '',
      colId: d.mdColor || '',
      colh: colorHexMap[d.mdColor] || '',
    };
    if (stats)
      entry.st = [
        stats.hp,
        stats.atk,
        stats.def,
        stats.spatk,
        stats.spdef,
        stats.agi,
      ];
    if (evoChain.length > 0) entry.evo = evoChain.map((e) => [e.dexNum, e.formNo]);
    if (evoTemplate) entry.evot = evoTemplate;
    if (d.isMega === 1) entry.mg = 1;
    if (d.isDMax === 1) entry.dm = 1;
    if (d.isInNumberSort === 1) entry.ns = 1;
    if (d.appearSoftwareAper?.length) entry.ag = d.appearSoftwareAper;
    // 图鉴大图（语言无关）
    const zukanKey = `${dexNum}_${d.formNo || 0}_0_${d.isDMax || 0}`;
    let image = zukanImageMap[zukanKey] || "";
    if (specialZukanKeyMap.hasOwnProperty(d.id)) {
      image = zukanOrgImageMap[specialZukanKeyMap[d.id]];
    }
    if (image) entry.i = image.replace(ZUKAN_IMG_PREFIX, "").replace(/\.png$/, "");
    const zukanKeyFemale = `${dexNum}_${d.formNo || 0}_1_${d.isDMax || 0}`;
    const imageFemale = zukanImageMap[zukanKeyFemale] || "";
    if (imageFemale) entry.if = imageFemale.replace(ZUKAN_IMG_PREFIX, "").replace(/\.png$/, "");
    return entry;
  });

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
  const typeNames = [];
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
    typeNames.push({ id: ty.id, name: t(ty.msname) || ty.id });
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
      desc: desc || "",
    };
  });

  // 能力值名称（用于性格加成/减成显示）
  const statNames = abilityRaw.map((ab) => ({ id: ab.id, name: t(ab.ms) }));
  writeFileSync(resolve(langOut, "stats.json"), JSON.stringify(statNames));

  // 精灵球
  const balls = ballsRaw
    .map((b) => ({
      id: b.id,
      number: b.number,
      name: t(b.msText),
      sort: b.sort,
    }))
    .sort((a, b) => a.number - b.number);

  // 区域（语言版本只保留名称）
  const regions = regionsRaw.map((r) => ({
    id: r.id,
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
    categoryId: w.mdWazaCategory || "",
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
  const colorNames = [];
  for (const c of colorRaw) {
    const name = t(c.ms);
    clMap[c.id] = name;
    if (name) colorNames.push({ id: c.id, name });
  }

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
    // 若该图鉴号有形态变换限制，剔除不在白名单中的形态
    if (
      formChangeRestrictedDexNums.has(dexNum) &&
      !formChangeAllowedIds.has(d.id)
    )
      continue;
    const zukanDescs = getZukanDescs(dexNum, d.formNo || 0);
    // 仅在详情页使用的扩展数据单独收集
    const ext = {};
    if (zukanDescs.length > 0) ext.z = zukanDescs;
    if (Object.keys(ext).length) pokemonExtras[d.id] = ext;
    // 多语言文件只保留需要翻译的字段，其余由根 pokemon.json 提供
    const entry = { id: d.id, _n: dexNum, _fn: d.formNo || 0 };
    entry.name = nmMap[d.mdNameId] || `#${dexNum}`;
    if (fmMap[d.mdForm]) entry.form = fmMap[d.mdForm];
    if (ctMap[d.mdCateId]) entry.cat = ctMap[d.mdCateId];
    if (htMap[d.mdHeightId]) entry.ht = htMap[d.mdHeightId];
    if (wtMap[d.mdWeightId]) entry.wt = wtMap[d.mdWeightId];
    pokemon.push(entry);
  }
  pokemon.sort((a, b) => a._n - b._n || a._fn - b._fn);
  // 排序后移除临时排序字段
  for (const p of pokemon) { delete p._n; delete p._fn; }

  const softwares = softRaw
    .filter((s) => s.msname)
    .map((s) => ({
      id: s.id,
      name: t(s.msname),
    }))
    .filter((s) => s.name && s.name !== s.id);
  const dexListValidIds = new Set(dexListConfig.map((d) => d.id));
  const dexList = dictMgmtRaw
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((dm) => dexListValidIds.has(dm.id))
    .map((dm) => {
      const name = t(dm.msRegionDicName);
      return { id: dm.id, name: name || dm.dicMdName };
    });
  const abilities = Object.values(tokuseiMap).filter((a) => a.name);

  // 奖章（语言版本只保留名称和描述）
  const ribbons = ribbonRaw
    .map((r) => {
      const idx = r.id.slice(2);
      const name = t(`ribbon_SV:mes_ribbon_name_${idx}`);
      const desc = t(`ribbon_SV:mes_ribbon_info_${idx}`);
      return {
        id: r.id,
        name: name || "",
        desc: desc || "",
      };
    })
    .sort((a, b) => a.order - b.order);

  // 道具（精灵球已有，加上完整道具名称列表）
  const itemNames = [];
  for (let i = 1; i <= 3000; i++) {
    const key = `itemname:ITEMNAME_${String(i).padStart(3, "0")}`;
    const name = t(key);
    if (name && name !== key) itemNames.push({ id: i, name });
  }

  writeFileSync(resolve(langOut, "pokemon.json"), JSON.stringify(pokemon));
  writeFileSync(
    resolve(langOut, "pokemon-descs.json"),
    JSON.stringify({ _g: gIndex, ...pokemonExtras }),
  );
  writeFileSync(resolve(langOut, "types.json"), JSON.stringify(typeNames));
  writeFileSync(resolve(langOut, "moves.json"), JSON.stringify(moves));
  writeFileSync(resolve(langOut, "natures.json"), JSON.stringify(natures));
  writeFileSync(resolve(langOut, "balls.json"), JSON.stringify(balls));
  writeFileSync(resolve(langOut, "regions.json"), JSON.stringify(regions));
  writeFileSync(resolve(langOut, "softwares.json"), JSON.stringify(softwares));
  writeFileSync(resolve(langOut, "dexList.json"), JSON.stringify(dexList));
  writeFileSync(resolve(langOut, "abilities.json"), JSON.stringify(abilities));
  writeFileSync(resolve(langOut, "colors.json"), JSON.stringify(colorNames));
  writeFileSync(resolve(langOut, "ribbons.json"), JSON.stringify(ribbons));
  writeFileSync(resolve(langOut, "items.json"), JSON.stringify(itemNames));

  console.log(
    `✅ ${langId} (${langName}): ${pokemon.length} pokémon, ${moves.length} moves, ${abilities.length} abilities`,
  );
}

// 语言列表元数据
const langMeta = LANGS.map(([id, name]) => ({ id, name }));
writeFileSync(resolve(OUT, "langs.json"), JSON.stringify(langMeta));
writeFileSync(resolve(OUT, "types.json"), JSON.stringify(typeConfig));
writeFileSync(resolve(OUT, "moves.json"), JSON.stringify(moveConfig));
writeFileSync(resolve(OUT, "dexList.json"), JSON.stringify(dexListConfig));
writeFileSync(resolve(OUT, "pokemon.json"), JSON.stringify(pokemonStatic));

// 性格全局配置（stat ID）
const natureConfig = temperRaw.map((pe) => ({
  id: pe.id,
  plus: pe.mdAbilityPlus || "",
  minus: pe.mdAbilityMinus || "",
}));
writeFileSync(resolve(OUT, "natures.json"), JSON.stringify(natureConfig));

// 区域全局配置
const regionConfig = regionsRaw.map((r) => ({ id: r.id, no: r.no }));
writeFileSync(resolve(OUT, "regions.json"), JSON.stringify(regionConfig));

// 奖章全局配置
const ribbonConfig = ribbonRaw
  .map((r) => ({
    id: r.id,
    order: r.order,
    image: r.image_a,
    hasAlt: !!r.image_b,
  }))
  .sort((a, b) => a.order - b.order);
writeFileSync(resolve(OUT, "ribbons.json"), JSON.stringify(ribbonConfig));

// 游戏版本全局配置（region 只存 ID）
const msToRegionId = Object.fromEntries(regionsRaw.map((r) => [r.ms, r.id]));
function findRegionId(msregion) {
  if (!msregion) return "";
  if (msToRegionId[msregion]) return msToRegionId[msregion];
  const mrKey = msregion.includes(":") ? msregion.split(":").pop() : msregion;
  const swSuffix = mrKey.includes("MAPNAME_") ? mrKey.split("MAPNAME_").pop() : mrKey;
  let bestRid = "";
  let bestLen = 0;
  for (const [ms, rid] of Object.entries(msToRegionId)) {
    const msKey = ms.includes(":") ? ms.split(":").pop() : ms;
    const suffix = msKey.includes("MAPNAME_") ? msKey.split("MAPNAME_").pop() : msKey;
    if (swSuffix.endsWith(suffix) && suffix.length > bestLen) {
      bestRid = rid;
      bestLen = suffix.length;
    }
  }
  return bestRid;
}
const softwareConfig = softRaw
  .filter((s) => s.msname)
  .map((s) => ({
    id: s.id,
    romId: s.romId,
    gen: s.gen,
    regionId: findRegionId(s.msregion),
  }));
writeFileSync(resolve(OUT, "softwares.json"), JSON.stringify(softwareConfig));

// 游戏组（用于详情页显示游戏可用性）
const gameGroups = softAppearRaw
  .filter((sa) => sa.appearTarget === 1)
  .sort((a, b) => a.appearTargetSort - b.appearTargetSort)
  .map((sa) => ({ id: sa.id, softwareIds: sa.mdSoftwares }));
writeFileSync(resolve(OUT, "gameGroups.json"), JSON.stringify(gameGroups));
console.log("✅ All done!");
