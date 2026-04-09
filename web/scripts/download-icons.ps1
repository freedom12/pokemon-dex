$outDir = "$PSScriptRoot\..\public\img\game_icon"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$headers = @{
    'Referer' = 'https://archives.bulbagarden.net/'
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

$icons = @(
    @{ id='SF024'; url='https://archives.bulbagarden.net/media/upload/7/73/HOME_X_icon.png' }
    @{ id='SF025'; url='https://archives.bulbagarden.net/media/upload/d/d5/HOME_Y_icon.png' }
    @{ id='SF026'; url='https://archives.bulbagarden.net/media/upload/e/e3/HOME_Alpha_Sapphire_icon.png' }
    @{ id='SF027'; url='https://archives.bulbagarden.net/media/upload/b/b7/HOME_Omega_Ruby_icon.png' }
    @{ id='SF030'; url='https://archives.bulbagarden.net/media/upload/7/7c/HOME_Sun_icon.png' }
    @{ id='SF031'; url='https://archives.bulbagarden.net/media/upload/2/25/HOME_Moon_icon.png' }
    @{ id='SF032'; url='https://archives.bulbagarden.net/media/upload/b/be/HOME_Ultra_Sun_icon.png' }
    @{ id='SF033'; url='https://archives.bulbagarden.net/media/upload/b/bb/HOME_Ultra_Moon_icon.png' }
    @{ id='SF034'; url='https://archives.bulbagarden.net/media/upload/4/44/HOME_GO_icon.png' }
    @{ id='SF042'; url='https://archives.bulbagarden.net/media/upload/1/19/HOME_Let%27s_Go_Pikachu_icon.png' }
    @{ id='SF043'; url='https://archives.bulbagarden.net/media/upload/3/3f/HOME_Let%27s_Go_Eevee_icon.png' }
    @{ id='SF044'; url='https://archives.bulbagarden.net/media/upload/f/fe/HOME_Sword_icon.png' }
    @{ id='SF045'; url='https://archives.bulbagarden.net/media/upload/c/c8/HOME_Shield_icon.png' }
    @{ id='SF046'; url='https://archives.bulbagarden.net/media/upload/c/cc/HOME_HOME_icon.png' }
    @{ id='SF047'; url='https://archives.bulbagarden.net/media/upload/b/ba/HOME_Legends_Arceus_icon.png' }
    @{ id='SF048'; url='https://archives.bulbagarden.net/media/upload/c/cf/HOME_Brilliant_Diamond_icon.png' }
    @{ id='SF049'; url='https://archives.bulbagarden.net/media/upload/7/75/HOME_Shining_Pearl_icon.png' }
    @{ id='SF050'; url='https://archives.bulbagarden.net/media/upload/2/29/HOME_Scarlet_icon.png' }
    @{ id='SF051'; url='https://archives.bulbagarden.net/media/upload/9/92/HOME_Violet_icon.png' }
    @{ id='SF052'; url='https://archives.bulbagarden.net/media/upload/4/4c/HOME_Legends_Z-A_icon.png' }
    @{ id='SF053'; url='https://archives.bulbagarden.net/media/upload/6/65/HOME_Champions_icon.png' }
    @{ id='SF000'; url='https://archives.bulbagarden.net/media/upload/f/f7/HOME_Bank_icon.png' }
)

foreach ($icon in $icons) {
    $outFile = Join-Path $outDir "$($icon.id).png"
    if (Test-Path $outFile) { Write-Host "Skip $($icon.id).png"; continue }
    try {
        Invoke-WebRequest -Uri $icon.url -Headers $headers -OutFile $outFile
        Write-Host "OK $($icon.id).png"
    } catch {
        Write-Host "FAIL $($icon.id): $_"
    }
}
Write-Host "Done!"
