# 《山海夜市》免费素材调研与生产建议

> 调研日期：2026-08-29  
> 适用项目：browser-first、俯视角 2D 类幸存者游戏  
> 目标风格：16×16 或 32×32 像素风，夜市暖光、民俗妖怪、厨具武器  
> 调研范围：只采信作者素材页、作者仓库、许可证原文和平台官方说明；本轮未下载任何素材。

## 1. 执行结论

当前没有找到一个同时满足“免费、授权清晰、俯视像素、统一画风、完整动画、中华夜市、山海妖怪、厨具战斗”的成套素材包。可行方案不是把多个包直接拼成正式美术，而是分两层推进：

1. **原型统一底座：Pixel-Boy 的 Ninja Adventure - Asset Pack。**它是目前最完整、最统一、授权最省心的候选：16×16 俯视像素风，包含 50+ 角色、30+ 怪物、9 个 Boss、60+ 物品、地形、100+ 音效、37 首音乐、UI、30+ 特效和 2 款字体；作者页面明确声明整个包采用 CC0，可用于商业游戏，无需署名。[作者素材页](https://pixel-boy.itch.io/ninja-adventure-asset-pack)
2. **生产版原创覆盖：山海夜市主题资产。**玩家角色、招牌妖怪、夜宵车/摊位、厨具武器、菜谱图标和主视觉必须原创，否则项目会读成“日本忍者 RPG 素材做的幸存者”，无法形成自己的识别度。
3. **通用补充包：Kenney。**UI、输入提示和通用特效优先使用 Kenney 的 CC0 资产；这些资源可直接进入正式版，也便于统一尺寸和许可管理。
4. **图标：Game-icons.net 作为信息结构底稿。**厨具种类覆盖很好，但为单色矢量且采用 CC BY 3.0，必须逐作者署名；建议统一重绘成 24×24 或 32×32 像素图标，而不是直接混入像素画面。
5. **音频：原型优先 Ninja Adventure/Kenney/明确 CC0 的 itch.io 包。**Freesound 只做缺口搜索；Sonniss 适合高质量拟真素材，但包很大、检索成本高，且当前许可证包含禁止 AI 训练等自定义条款。
6. **中文字体：Noto Sans SC。**采用 OFL 1.1，可嵌入商业网页游戏；只带 Regular/Semibold 两个字重并按实际字符子集化，避免把完整 CJK 字库塞进首包。

### 推荐级别说明

- **A / 直接采用**：授权清晰、风格或功能高度匹配，可进入 MVP 或正式版。
- **B / 有条件采用**：适合占位、局部补充或需重绘、调色、裁切后使用。
- **C / 仅作参考**：风格、尺寸、主题或工作流成本不匹配，不建议直接进入成品。

## 2. 许可证基线

| 许可证 | 商业使用 | 署名 | 项目规则 |
|---|---:|---:|---|
| CC0 1.0 | 可以 | 不要求 | 可复制、修改、分发及商用；仍不覆盖商标、肖像、隐私等其他权利。优先选。[CC0 官方说明](https://creativecommons.org/publicdomain/zero/1.0/) |
| CC BY 3.0 | 可以 | 必须 | 必须给出作者、素材来源、许可证链接，并标明是否修改；不得暗示作者背书。[CC BY 3.0 官方说明](https://creativecommons.org/licenses/by/3.0/) |
| SIL OFL 1.1 | 可以 | 不要求显示在游戏画面 | 字体可嵌入、随软件分发；发行包中保留版权及许可证文本。字体不可单独售卖；修改字体还要处理保留字体名等条款。[Noto CJK LICENSE](https://github.com/notofonts/noto-cjk/blob/main/Sans/LICENSE) |
| Sonniss GDC Bundle EULA 2.0 | 可以 | 不要求 | 可修改并用于无限商业项目，但不能把原始音效作为素材库重新供应，也禁止用于 AI 训练。以**下载当天**官网公布的版本为准。[当前许可证](https://sonniss.com/gdc-bundle-license/) |

“免费”“随意付费”只是价格，不是许可证。每次正式入库仍要保存下载日页面、ZIP 内 LICENSE 和哈希；这份文档是选材记录，不代替发行前法律复核。

## 3. 候选素材总表

### 3.1 统一视觉底座

| 候选 | 官方来源 | 许可与要求 | 已核实规格/内容 | 建议用途 | 级别 | 风险与缺口 |
|---|---|---|---|---|---:|---|
| **Ninja Adventure - Asset Pack**，Pixel-Boy | [itch.io 作者页](https://pixel-boy.itch.io/ninja-adventure-asset-pack)、[作者 GitHub 仓库](https://github.com/pixel-boy/NinjaAdventure) | CC0 1.0；商业可用、可修改、无需署名，作者希望得到自愿链接 | 16×16；50+ 动画角色、30+ 动画怪物、9 Boss、60+ 物品、tileset、100+ SFX、37 BGM、UI、30+ VFX、2 字体 | **整个可玩原型的唯一视觉/音频底座**；保留动画节奏、碰撞框和图集结构，逐步替换主题资产 | **A** | 忍者/和风而非中华夜市；广泛使用，辨识度较低；生产版不能原样当核心视觉 |
| **Roguelike/RPG pack**，Kenney | [官方素材页](https://kenney.nl/assets/roguelike-rpg-pack) | CC0；商业可用、无需署名 | 16×16；1700+ 文件 | 如果不采用 Ninja Adventure，可作为**另一条完整原型路线**，覆盖地面、墙、道具、角色、敌人和拾取 | B | 2015 老素材、使用广、辨识度低；不能与 Ninja Adventure 同时充当主底座，只能二选一 |
| **Tiny Dungeon**，Kenney | [官方素材页](https://kenney.nl/assets/tiny-dungeon) | CC0；商业可用、无需署名 | 16×16 tiles；130 文件；俯视像素地下城 | 地面、墙、箱子和通用小物的备用占位 | B | 地牢主题、色调偏冷，不足以构成夜市；与 Ninja Adventure 并用需统一色板 |
| **Roguelike Characters**，Kenney | [官方素材页](https://kenney.nl/assets/roguelike-characters) | CC0；商业可用、无需署名 | 像素风；450 文件；角色/roguelike 标签 | 敌人碰撞、受击、死亡流程占位；也可做图鉴轮廓测试 | B | 页面未标帧尺寸；人物更像通用西式 RPG，角色个性与动画表现不足 |
| **Devolution Topdown tilesets and sprites**，Brosnya | [OpenGameArt 作者投稿页](https://opengameart.org/content/devolution-topdown-tilesets-and-sprites) | 投稿页明确 CC0 | 16×16；户外、洞穴、室内 tileset；带角色、敌人、效果、物件、UI | CC0 备用原型包，或参考 16×16 动画压缩方式 | C | 暗黑奇幻主题；质量和覆盖面不及 Ninja Adventure；不应混拼到正式画面 |

**决定：**MVP 只选 Ninja Adventure 作为底座，不同时拼 Kenney/OGA 角色。其他包用于缺口验证或参考，不作为第二套主画风。

### 3.2 UI 与输入提示

| 候选 | 官方来源 | 许可与要求 | 已核实规格/内容 | 建议用途 | 级别 | 风险与缺口 |
|---|---|---|---|---|---:|---|
| **UI Pack - Pixel Adventure**，Kenney | [官方素材页](https://kenney.nl/assets/ui-pack-pixel-adventure) | CC0 | 500 文件；pixel、button、panel、slider | 按钮、卡片底板、滑条、弹窗、商店/升级选择框 | **A** | 幻想冒险外观，正式版应重配夜市红、炭黑、纸黄、青玉色；先做九宫格拉伸测试 |
| **Pixel UI Pack**，Kenney | [官方素材页](https://kenney.nl/assets/pixel-ui-pack) | CC0 | 750+ 文件 | 血条、经验条、按钮、面板、商店和升级选择框的更大备选集 | A/B | 与 UI Pack - Pixel Adventure 二选一；先做 1 张完整 HUD 对比稿再锁定，不允许正式界面混用两套边框语言 |
| **Input Prompts Pixel**，Kenney | [官方素材页](https://kenney.nl/assets/input-prompts-pixel) | CC0 | 16×16；800 文件；键鼠、Xbox、Nintendo、PlayStation 组合符号、Steam Controller/Deck、街机、通用手柄、触摸 | 教程、暂停页、控制器热切换提示 | **A** | PlayStation 图标需按包说明组合；平台商标展示还应遵守各平台品牌规范；网页触摸操作需另画虚拟摇杆状态 |
| **Ninja Adventure UI elements** | [作者素材页](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | CC0 | 包内含 UI element，页面未逐项给尺寸 | 原型 HUD、血条、背包与选项菜单，保持与原型角色同风格 | A（原型） | 正式版夜市品牌感弱；需在入库时核对包内实际文件结构 |
| **Game Icons / Game Icons Expansion**，Kenney | [Game Icons](https://kenney.nl/assets/game-icons)、[Expansion](https://kenney.nl/assets/game-icons-expansion) | CC0 | 105 + 60 文件 | 通用系统图标、控制设置、稀有度/标签占位 | B | 不是专门的厨具/菜谱图标；视觉语言与 Game-icons.net 不一致，只选一套用于同一界面 |

### 3.3 物品、武器与技能图标

| 候选 | 官方来源 | 许可与要求 | 已核实规格/内容 | 建议用途 | 级别 | 风险与缺口 |
|---|---|---|---|---|---:|---|
| **Kitchenware tag：59 Kitchenware icons**，Game-icons.net | [官方标签与下载页](https://game-icons.net/tags/kitchenware.html)、[官方许可说明](https://game-icons.net/about.html) | CC BY 3.0；每个图标必须按其页面署名原作者，标出来源、许可证及修改 | 单色 SVG/PNG，可在线改色；具体图标作者不同 | 厨具武器与料理标签的**轮廓库/设计底稿** | **A（重绘）** | 非像素风；整包不能只署名“Game-icons.net”，必须保留逐图标作者映射 |
| **Wok**，Caro Asercion | [图标页](https://game-icons.net/1x1/caro-asercion/wok.html) | CC BY 3.0；署名 Caro Asercion | SVG/PNG，方形构图 | 铁锅武器、爆炒火环技能 | A（重绘） | 需像素化并记录“已修改” |
| **Cooking pot**，Delapouite | [图标页](https://game-icons.net/1x1/delapouite/cooking-pot.html) | CC BY 3.0；署名 Delapouite | SVG/PNG，方形构图 | 汤锅、防御/范围持续伤害 | A（重绘） | 与 Wok 功能轮廓相近，需在造型或颜色上拉开差异 |
| **Meat cleaver**，Lorc | [图标页](https://game-icons.net/1x1/lorc/meat-cleaver.html) | CC BY 3.0；署名 Lorc | SVG/PNG，方形构图 | 菜刀、回旋投射物 | A（重绘） | 轮廓凶悍，适合战斗；避免照搬细碎高光到 24px 图标 |
| **Ladle**，Delapouite | [图标页](https://game-icons.net/1x1/delapouite/ladle.html) | CC BY 3.0；署名 Delapouite | SVG/PNG，方形构图 | 汤勺、击退或抛洒武器 | A（重绘） | 细长轮廓在小尺寸易糊，需 2px 以上主干 |
| **Kitchen knives**，Lorc | [图标页](https://game-icons.net/1x1/lorc/kitchen-knives.html) | CC BY 3.0；署名 Lorc | SVG/PNG | 菜刀组合、切割、暴击、流血词条 | A（重绘） | 多刀细节在 24/32px 下易挤成一团；更适合升级卡而非世界精灵 |
| **Chopsticks**，Delapouite | [图标页](https://game-icons.net/1x1/delapouite/chopsticks.html) | CC BY 3.0；署名 Delapouite | SVG/PNG | 筷子/竹签穿透武器 | A（重绘） | 细线需加粗；在小尺寸必须强化夹取端与方向性 |
| **Chili pepper**，Delapouite | [图标页](https://game-icons.net/1x1/delapouite/chili-pepper.html) | CC BY 3.0；署名 Delapouite | SVG/PNG | “辣”属性、燃烧、狂暴 | A（重绘） | 不能只靠红色传意，需保留弯曲轮廓/火花徽记以兼容色觉缺陷 |
| **Fire bowl**，Lorc | [图标页](https://game-icons.net/1x1/lorc/fire-bowl.html) | CC BY 3.0；署名 Lorc | SVG/PNG | 炉火、炭火、持续伤害 | A（重绘） | 与铁锅轮廓可能相似，需要火焰负形和底座造型区分 |
| **Ringing bell**，Lorc | [图标页](https://game-icons.net/1x1/lorc/ringing-bell.html) | CC BY 3.0；署名 Lorc | SVG/PNG | 外卖铃、召唤、警戒、音波 | A（重绘） | 直接画成西式手铃会偏题；重绘时改为摊位/自行车铃语义 |
| **Pixel Platformer Food Expansion**，Kenney | [官方素材页](https://kenney.nl/assets/pixel-platformer-food-expansion) | CC0 | 像素食物；110 文件 | 食材、掉落物、菜谱素材占位 | B | 为平台游戏绘制，视角和主底座未必一致；正式版需重绘成统一的 24/32px 图标 |

**署名模板示例：**`“Wok” by Caro Asercion, Game-icons.net, CC BY 3.0；已重绘、调色。` 对每个实际使用的图标分别记录，不要在尚未选定图标前预填整站作者。

### 3.4 地面、夜市环境与道具

| 候选 | 官方来源 | 许可与要求 | 已核实规格/内容 | 建议用途 | 级别 | 风险与缺口 |
|---|---|---|---|---|---:|---|
| **Ninja Adventure tilesets** | [作者素材页](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | CC0 | 16×16；地板自动拼接、室外和室内元素等 | MVP 地面、道路、墙体、装饰 | **A（原型）** | 正式版仍缺夜市路面油渍、摊棚、灯笼、霓虹招牌、桌椅、炉具、餐车 |
| **Free CC0 Top Down Tileset Template Pixel Art**，rgsdev | [OpenGameArt 投稿页](https://opengameart.org/content/free-cc0-top-down-tileset-template-pixel-art) | CC0；无需署名 | 16×16；5 个颜色变体 | 自制地面自动拼接模板，验证 Tiled/Phaser tilemap 规则 | B | 只是低细节模板，不是成品环境；优点是便于从零覆盖自己的色板 |
| **Top Down Asset Pack 1.0**，IshtartPixels | [OpenGameArt 投稿页](https://opengameart.org/content/top-down-asset-pack-10) | CC0；作者明确商业可用、无需署名 | 16×16；地图、角色、僵尸 | 草地/地面占位和碰撞测试 | C | 内容小且主题不符；不要与主包直接混用 |
| **Feudal Japan Props Vol.2**，PixelKensei | [itch.io 作者页](https://pixelkensei.itch.io/feudal-japan-props-vol2-free-pixel-art-assets) | 页面明确 CC0，商业可用、无需署名 | 8 个 32×32 RGBA 顶视像素建筑件；含 spritesheet 和 `.gpl`（GIMP Palette）色板；包括 market stall roof、木桥、井、门、台阶等 | 摊位屋顶和木结构的构图参考；若选择 32×32 路线可作临时道具 | B/C | 日本封建主题不是中华夜市；32×32 与推荐的 16×16 底座不兼容；只作参考或完整重绘 |
| **Feudal Japan Props Vol.3**，PixelKensei | [itch.io 作者页](https://pixelkensei.itch.io/feudal-japan-props-vol3-free-pixel-art-assets) | 页面明确 CC0，商业可用、无需署名 | 8 个 32×32 RGBA 顶视自然件；spritesheet + `.gpl`（GIMP Palette）色板；竹林、莲池、石路等 | 竹、莲、石路的构图参考 | C | 同上；樱花等符号会把地域读成日本，应避免直接作为主题资产 |
| **Orthographic outdoor tiles**，Buch | [OpenGameArt 投稿页](https://opengameart.org/content/orthographic-outdoor-tiles) | CC0；无需署名 | 16×16；草地、泥地、树、围栏、建筑 | 开放区域与市场外围灰盒 | C | 页面评论讨论过与《塞尔达》的视觉相似性；即使上传者标为 CC0，正式商业版也应替换，不作为最终地面 |

### 3.5 角色、敌人与 Boss

| 候选 | 官方来源 | 许可与要求 | 已核实规格/内容 | 建议用途 | 级别 | 风险与缺口 |
|---|---|---|---|---|---:|---|
| **Ninja Adventure characters / monsters / bosses** | [作者素材页](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | CC0 | 16×16；50+ 动画角色、30+ 动画怪物、9 动画 Boss | MVP 的 3 玩家、6 普通敌人、2 精英、1 Boss 占位；复用动画节拍和 pivot 规范 | **A（原型）** | 忍者、日式妖怪倾向；正式版必须优先替换玩家、Boss 和宣传截图中出现的敌人 |
| **Roguelike Characters**，Kenney | [官方素材页](https://kenney.nl/assets/roguelike-characters) | CC0 | 450 个像素文件 | 快速扩敌人轮廓、碰撞尺寸和群体密度测试 | B | 风格扁平、动画信息未在页面列明；只作压力测试占位 |
| **Devolution Topdown tilesets and sprites** | [OpenGameArt 投稿页](https://opengameart.org/content/devolution-topdown-tilesets-and-sprites) | CC0 | 16×16，带角色挥剑与一个敌人 | 攻击帧和四向动画参考 | C | 覆盖太小、暗黑奇幻，不能支撑内容量 |
| **1-bit Pixel Monsters**，Ruskerdax | [OpenGameArt 投稿页](https://opengameart.org/content/1-bit-pixel-monsters) | CC0；作者明确可商用、可修改、无需署名 | 1-bit；128×128；怪物静态图 | 妖怪剪影与造型发散参考 | C | 非顶视、非 16×16、缺动画；不直接进入游戏 |
| **Animated Monsters**，stealthix | [OpenGameArt 投稿页](https://opengameart.org/content/animated-monsters) | CC0 | Zombie、Skeleton、Witch；Idle、Walk、Punch、Hurt、Fall；独立透明图集，Endesga 32 色板 | 原型普通怪/精英的状态机和动画导入验证 | B | 投稿页未给精确单帧格尺寸，入库时必须人工核验；题材不是中国妖怪 |
| **16×16 Fantasy RPG Trash Mobs (animated)**，Emcee Flesher | [OpenGameArt 投稿页](https://opengameart.org/content/16x16-fantasy-rpg-trash-mobs-animated) | 页面同时列 OGA-BY 3.0 与 CC0；项目应明确选择 **CC0 分支**并保存页面快照 | 16×16 Tiny Pixel Art，透明 PNG | 批量普通怪占位，验证同屏密度和小尺寸可读性 | B/C | 帧顺序文档不完整；多重许可必须在 manifest 中明确选择；不能成为正式“山海妖怪” |
| **Tiny RPG CC0 Characters and Portraits**，tiopalada | [OpenGameArt 投稿页](https://opengameart.org/content/tiny-rpg-cc0-characters-and-portraits) | CC0 | Tiny RPG Character/Face Workshop 产出的角色和头像样例 | 角色选择页、对话头像和角色原型 | C | 页面未列精确格尺寸且数量有限；正式角色与头像仍需原创 |

### 3.6 特效

| 候选 | 官方来源 | 许可与要求 | 已核实规格/内容 | 建议用途 | 级别 | 风险与缺口 |
|---|---|---|---|---|---:|---|
| **Ninja Adventure visual effects** | [作者素材页](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | CC0 | 30+ VFX | 原型攻击、受击、升级、元素效果 | **A（原型）** | 页面未逐项给帧尺寸；正式版需重新配色和补齐油、辣、糖、冰、发酵五类识别 |
| **Particle Pack**，Kenney | [官方素材页](https://kenney.nl/assets/particle-pack) | CC0 | 80 文件；每 tile 512×512 | Phaser 粒子纹理：火花、烟、尘、拾取闪光等，可运行时染色缩放 | A/B | 原图很大；Web 端应做图集、压缩和尺寸裁剪，不能把整包原尺寸全载入首场景 |
| **Light Masks**，Kenney | [官方素材页](https://kenney.nl/assets/light-masks) | CC0 | 150 文件；light/shader/VFX | 灯笼、炉火、霓虹和精英光圈的 additive mask | A/B | 2026 新包，落地前要检查 WebGL blend 视觉和移动端 overdraw；不应让每个敌人都带动态光 |
| **Animated particle effects #2**，para | [OpenGameArt 投稿页](https://opengameart.org/content/animated-particle-effects-2) | CC0 | sheet 1024×1024；多数 128×128 单元、64 帧、30fps；血击中为 512×512、16 帧 | 火焰、气泡、传送等概念和高规格 Boss 特效备选 | C | 对 16×16 像素风过于平滑且帧数/纹理过重；只选单个效果并降帧、像素化，绝不整包常驻 |
| **PVFX Foundry — Free Pixel VFX Pack** | [itch.io 作者页](https://nerijs.itch.io/pvfx-foundry) | 渲染图、元数据和文档均为 CC0 1.0 | v0.4.0；22 个效果、44 张透明 PNG 图集；每格 96×96、20fps；固定五列/紧凑图集和 JSON 元数据 | 斩击、火爆、冰环、酸液、地裂、治疗、烟尘、传送门、落地尘 | **A/B** | 对 16×16 人物偏大，需在 0.5× 或 32px 角色方案中实测；资源较新，锁版本与 SHA-256，不直接覆盖本项目独有元素造型 |

### 3.7 UI 与战斗音效

| 候选 | 官方来源 | 许可与要求 | 已核实规格/内容 | 建议用途 | 级别 | 风险与缺口 |
|---|---|---|---|---|---:|---|
| **Interface Sounds**，Kenney | [官方素材页](https://kenney.nl/assets/interface-sounds) | CC0 | 100 文件 | 按钮 hover/click、确认、取消、升级选择、错误提示 | **A** | 需精选一小套并统一响度；避免每次 hover 都播放造成疲劳 |
| **Impact Sounds**，Kenney | [官方素材页](https://kenney.nl/assets/impact-sounds) | CC0 | 130 文件 | 近战命中、硬物碰撞、Boss 重击 | **A** | 通用拟真风，需与像素/合成音混音；高频攻击要做 3–5 个变体与随机 pitch |
| **RPG Audio**，Kenney | [官方素材页](https://kenney.nl/assets/rpg-audio) | CC0 | 50 文件；footstep、weapon、foley | 脚步、武器挥动、拾取、装备 | A/B | 2014 旧包，先审核噪声和响度；幸存者高密度脚步通常只给玩家，不给每个敌人 |
| **Music Jingles**，Kenney | [官方素材页](https://kenney.nl/assets/music-jingles) | CC0 | 85 文件 | 升级、波次开始、胜败、稀有掉落等短提示 | **A** | 素材页未列格式/采样率，下载验收时核实；不要让过多 jingle 打断战斗音乐 |
| **Interface SFX Pack 1 (CC0)**，ObsydianX | [itch.io 作者页](https://obsydianx.itch.io/interface-sfx-pack-1) | CC0；作者明确商业/非商业均可，无限制 | 200+ UI 音效；Confirm、Back、Cursor、Error 多组变体；WAV 与 OGG 两版 | 菜谱合成、商店、升级卡、错误反馈；PSX/JRPG 感与像素风接近 | **A** | 包较大；只导入精选 OGG，统一峰值/响度；不要同时混用太多 UI 音色系列 |
| **200 Free SFX**，Kronbits | [itch.io 作者页](https://kronbits.itch.io/freesfx) | 页面及 Asset license 均明确 CC0；个人/商业项目不限次数、无需署名 | 98MB；223 WAV；41 文件夹；多数为 16-bit、44.1/48kHz、mono 或 stereo；含 Blip、Ambience、Charge、Explosion、Negative/Wrong 等类别 | 技能蓄力、警报、状态提示、元素攻击和失败反馈的 retro/electronic 补充 | B | 电子/复古风很强，不能单独承担锅、刀、碗碟等料理拟真层；按实际事件精选，不整包入库 |
| **Magic Spell SFX**，JaggedStone | [OpenGameArt 投稿页](https://opengameart.org/content/magic-spell-sfx) | CC0；页面写明无需署名 | 7 个 OGG，单文件约 37.4–79.1KB | 辣/冰/油/糖技能起手、稀有事件、升级选择 | B | 原声较通用；需要 pitch、EQ 和分层设计，避免不同元素听起来相同 |
| **Monster Sound Pack, Volume 1**，Ogrebane | [OpenGameArt 投稿页](https://opengameart.org/content/monster-sound-pack-volume-1) | CC0 | 约 2MB ZIP；WAV 怪物 growl、grunt、death | 2–3 类普通妖怪的攻击/受击/死亡，再做 pitch 变体 | B | 年代较久；需试听底噪、响度和同包一致性，不宜一声覆盖所有怪物 |
| **Impact**，qubodup | [OpenGameArt 投稿页](https://opengameart.org/content/impact) | CC0；页面推荐署名但法律上非强制 | 131KB 的 7z；metal、wood、stone、flesh、wet 标签 | 厨具与不同敌人材质的命中补层 | B | 7z 需人工/工具解包；入库前试听并检查实际文件格式；不要把作者的推荐署名误记为强制要求 |
| **Ninja Adventure SFX** | [作者素材页](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | CC0 | 100+ SFX | 原型一站式音频，保持早期风格一致 | A（原型） | 页面不列单项名；入库后才能确认命中层次是否足够，正式版可能仍缺炒、切、煎、油爆、碗碟等“料理战斗”声音 |
| **GDC 2026 Game Audio Bundle**，Sonniss | [官方 2026 包页](https://gdc.sonniss.com/)、[当前许可证](https://sonniss.com/gdc-bundle-license/) | 自定义 EULA 2.0（2026-08-27 生效）：商业可用、无需署名、可修改；不可把原文件当素材供应；禁止 AI 训练 | 7.47GB+、347+ 文件；专业供应商样本 | 搜索锅具、金属、火焰、市场氛围、液体、重击等少量高质量层 | B | 体积和筛选成本高；不是 CC；**下载当日许可证决定权利**，必须保存页面/PDF/ZIP 证据；不用于任何生成式音频流程 |
| **Freesound** | [官方 FAQ/许可证说明](https://freesound.org/help/faq/) | 每条声音独立为 CC0、CC BY 或 CC BY-NC；商业项目只准入 CC0/CC BY，排除 BY-NC | 规格随条目变化 | 只补“炒锅、切菜、油爆、夜市人群、碗碟”等明确缺口 | B/C | 平台不保证上传者确实拥有全部权利；逐条保存声音 ID、作者、URL、下载日、许可；避开影视/游戏采样、知名音乐、乐器 ROM 和来源含糊条目 |

#### 已核验的 Freesound 具体条目

| 条目 | 条目页显示许可 | 已核实规格 | 用途 | 推荐与风险 |
|---|---|---|---|---|
| **frying rice on a wok.wav**，soundofsong | [CC0 条目页](https://freesound.org/people/soundofsong/sounds/679946/) | WAV；26.734s；44.1kHz；16-bit；stereo；4.5MB | 夜市背景、炉火技能待机、铁锅攻击层；剪为 3–8 秒 loop | **A/B**；很贴题，但需降噪、淡入淡出和循环测试 |
| **Whoosh 01**，velcronator | [CC0 条目页](https://freesound.org/people/velcronator/sounds/733888/) | WAV；0.541s；44.1kHz；24-bit；stereo；140.6KB | 菜刀、竹签、风扇挥击；做 ±3%/±6% 克制 pitch 变体 | **A/B**；通用 whoosh，需叠加金属/木材层来区分武器 |
| **LevelUp.wav**，Kenneth_Cooney | [CC0 条目页](https://freesound.org/people/Kenneth_Cooney/sounds/609335/) | WAV；0.621s；48kHz；16-bit；stereo；120.6KB | 经验升级占位 | B；明显 8-bit，正式版宜替换为铜铃/锣/筷子敲击的原创分层声 |
| **Bike Bell.wav**，bsumusictech | [CC0 条目页](https://freesound.org/people/bsumusictech/sounds/81875/) | WAV；1.772s；44.1kHz；16-bit；stereo；305.3KB | 外卖铃技能或商店刷新 | **A/B**；语义贴合，需裁去不需要的尾音并检查高频刺耳度 |
| **CROWD**，SamuelGremaud | [CC0 条目页](https://freesound.org/people/SamuelGremaud/sounds/545756/) | WAV；2:47.269；48kHz；24-bit；stereo；45.9MB；法国南部市场现场录音 | 仅作低音量原型 ambience | C；可辨法语/地域不符，且 CC0 不处理录音中第三人的隐私/人格权；正式版应自录不可辨人声的本地夜市氛围 |

Sonniss 2026 的[官方文件表](https://docs.google.com/spreadsheets/d/1MkoGwA6FfgNXhye9wLnY0gNLvjEp4H2iYXM1YxMI6Qs/edit?usp=sharing)中可优先试听名称包含 witch's cauldron fire、spear/stick wooden impact、sword metallic impact、ice crush/crack、magic gesture 和 Organic UI/Kalimba Up 的文件。只选 10–20 个高价值材质层转换为运行时格式；原始 WAV 和 EULA 留在非公开归档，不把 7.47GB 整包加入仓库或 `public/`。

### 3.8 音乐

| 候选 | 官方来源 | 许可与要求 | 已核实规格/内容 | 建议用途 | 级别 | 风险与缺口 |
|---|---|---|---|---|---:|---|
| **Ninja Adventure music** | [作者素材页](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | CC0 | 37 首音乐 | MVP 标题、战斗、Boss、结算音乐 | **A（原型）** | 和风/通用 RPG 身份较强；正式版需要夜市民乐音色与电子节拍融合的原创主题 |
| **Not Jam Music Pack 2** | [itch.io 作者页](https://not-jam.itch.io/not-jam-music-pack-2) | 作者页明确 CC0；商业/非商业可用、无需许可或署名；页面标示未使用生成式 AI | OGG 包 31MB、WAV 包 175MB；15 个 loopable tracks；另有 41 个 Gameboy/NES SFX（WAV 1.4MB）；包含 battle_commences、battle_ceases、grumpy_shopkeep、leading_the_charge、safe_space、lich_king_ascendant 等 | 原型动态音乐：普通战斗/危急/商店/精英/Boss 可快速映射 | **A（原型）** | 明显 Gameboy/NES 风，不能建立中华夜市辨识度；部分曲目为 crossfade 设计，需按作者长度说明实现与测试 |
| **FREE Music Loop Bundle**，Tallbeard Studios / Abstraction | [itch.io 作者页](https://tallbeard.itch.io/music-loop-bundle) | 页面明确 CC0；商业/非商业可用、可修改，署名不要求；作者对 NFT、AI/ML、原样转售表达“不认可”，页面同时说明这些在 CC0 条款内仍属允许 | 200+ seamless loops；有 chiptune、ambient、upbeat 等；分季度 ZIP，2026-Q2 包 71MB | 从 song browser 选 1 首标题、1 首战斗、1 首结算占位，不必下载全部历史包 | **A/B** | 音乐是作者“sketchbook”，曲目风格跨度大；必须试听循环点和长时间重复疲劳；不保证有中华夜市风格 |
| **Chipnese**，Spring Spring / Julie Damsgaard | [OpenGameArt 投稿页](https://opengameart.org/content/chipnese) | CC0；署名不强制 | OGG 994.8KB，另有 14.7KB 源文件 ZIP；作者称为 Chinese-sounding chiptune | 极早期“东方电子”氛围占位或参考 | C | 名称和编曲可能落入刻板“东方感”；不建议作为正式主题音乐 |
| **Chiptune Battle Music**，pmiller | [OpenGameArt 投稿页](https://opengameart.org/content/chiptune-battle-music) | CC0；页面明确无需署名 | OGG/WAV；约 7.5 秒处可无缝回环 | 极早期战斗循环、自动化音频加载测试 | B/C | 循环很短，10–15 分钟一局会迅速疲劳；JRPG 感强，只适合技术占位 |
| **Rin's Theme**，request | [OpenGameArt 投稿页](https://opengameart.org/content/rins-theme-loopable-chiptune-adventurebattle-bgm) | CC0；署名仅为作者希望、非强制 | 独立 intro/loop/full OGG；loop 文件约 2.2MB | 高速战斗节奏占位 | B | 弹幕/日系 chiptune 倾向，不是夜市主题；正式版不建议作为主旋律 |
| **Samurai Nights** | [OpenGameArt 投稿页](https://opengameart.org/content/samurai-nights) | 多重许可可选；若采用，明确选择 CC BY 4.0 并按其要求署名、链接许可、标明修改 | 3.9MB ZIP；完整曲与独立 loops；作者称使用二胡等传统中国乐器并面向战斗场景 | 只作音乐方向试听；听感确实合适时才进入候选 | C | 标题/主题为 Samurai，日中语义混合；版权合规不等于文化语义适合，默认不直接进正式版 |

### 3.9 中文字体

| 候选 | 官方来源 | 许可与要求 | 已核实规格/内容 | 建议用途 | 级别 | 风险与缺口 |
|---|---|---|---|---|---:|---|
| **Noto Sans SC / Noto Sans CJK SC** | [Noto 官方使用说明](https://github.com/notofonts/noto-docs/blob/main/docs/website/use.md)、[官方仓库](https://github.com/notofonts/noto-cjk)、[LICENSE](https://github.com/notofonts/noto-cjk/blob/main/Sans/LICENSE) | SIL OFL 1.1；可用于商业产品、可嵌入和随软件分发；字体不能单独售卖，分发时保留版权和 LICENSE；修改字体需遵守 OFL 与保留字体名规则 | 官方说明 Noto Sans CJK 有 7 字重并提供变量字体；SC 是中国大陆简体中文变体，覆盖 CJK 基本平面汉字及大量扩展字符 | 正文、数值、设置、无障碍文本；推荐 Regular 400 + Semibold 600，自托管 WOFF2 并子集化 | **A** | 完整 CJK 字体体积大；动态玩家名/未来多语言会让静态子集漏字，必须定义字符覆盖策略 |
| **Source Han Sans / 思源黑体**，Adobe | [Adobe 官方仓库](https://github.com/adobe-fonts/source-han-sans)、[许可证文件](https://github.com/adobe-fonts/source-han-sans/blob/master/LICENSE.txt) | SIL OFL 1.1 | Pan-CJK OpenType 字体，提供 OTF/OTC/Variable OTF/TTF/WOFF2 等配置 | 与 Noto Sans CJK 二选一；美术和运营若习惯“思源黑体”命名可采用 | A（备选） | 与 Noto Sans CJK 源流/字形高度相关，不要两套都打包；仍需子集化及保留 LICENSE |
| **得意黑 / Smiley Sans**，atelier-anchor | [作者官方仓库](https://github.com/atelier-anchor/smiley-sans)、[LICENSE](https://github.com/atelier-anchor/smiley-sans/blob/main/LICENSE) | SIL OFL 1.1；修改版本不能沿用保留名称 “Smiley” 和“得意黑” | 窄、斜、手绘标题风；支持简体中文常用字及多种文字；仓库提供 WOFF2 | 游戏标题、Boss 名、波次标题、菜谱解锁标题；只用于短句/大字号 | **A（标题）** | 不适合正文和手机小 UI；部分字形为美术表现而非严格大陆规范字形；使用前列出实际标题字符并逐字检查 |

## 4. 正式版必须原创的主题资产

免费包可以让游戏跑起来，但不能替代下面这些构成卖点的资产。

### 4.1 第一张地图的最低原创清单

| 类别 | MVP 数量 | 推荐规格 | 必须体现的主题信息 |
|---|---:|---|---|
| 玩家角色 | 3 | 24×24 或 32×32 逻辑框；四向待机/移动，各 4–6 帧；受击、倒地 | 摊主、跑堂、食客/异人三种轮廓；避免通用战士/法师模板 |
| 普通妖怪 | 6 | 小怪 16–32px；移动 4 帧、受击 1 帧、死亡 4–6 帧 | 追逐、冲锋、远程、分裂、辅助、封路分别有清晰剪影 |
| 精英 | 2 | 32–48px；在普通怪基础上追加发光/部件，不只换色 | 玩家在混战中 0.3 秒内能认出技能危险性 |
| Boss | 1 | 64×64 左右；待机/移动/前摇/攻击/受击/死亡 | 一个可用于商店封面与分享截图的原创“山海夜市”标志形象 |
| 武器世界精灵 | 8–12 | 16–32px；旋转中心、命中区域单独定义 | 菜刀、竹签、铁锅、炉火、风扇、外卖铃等必须与图标一致 |
| 物品/技能图标 | 30–40 | 24×24 或 32×32，1–2px 描边，固定光源 | 辣、冰、油、糖、发酵标签；稀有度不能只靠红绿颜色 |
| 环境 tiles | 1 套 | 推荐 16×16 基础 tile；2×/3× 组合件 | 湿石路、油渍、排水沟、摊棚布、木桌、塑料凳、灯笼、招牌、炉具、餐车 |
| 主题 VFX | 10–15 | 16–64px，4–8 帧为主 | 刀光、火环、油花、冰晶、糖爆、发酵泡、蒸汽、升级烟花 |
| UI 品牌件 | 1 套 | 9-slice 面板 + 图标 + 标题字 | 纸菜单、木牌、搪瓷碗、霓虹、印章；保持文字高对比 |

### 4.2 找不到可靠统一免费包的具体缺口

- 中华夜市的顶视摊位、餐车、炉灶、折叠桌椅、灯箱、中文价目牌。
- 山海经/民俗妖怪的统一四向像素动画，尤其是能承担 Boss 宣传图的原创形象。
- 厨具武器从图标、世界精灵、投射物到特效的一致套件。
- “炒、切、煎、炸、蒸、碗碟碰撞”的一套有节奏、可高频播放的战斗音效。
- 带中国夜市感、但不流于现成“古风素材”的 10–15 分钟动态战斗音乐。
- 中文像素标题字。Noto/思源适合正文，不会自动提供有品牌感的游戏 Logo。

这些应列入原创预算，不继续耗时搜索“恰好完全匹配”的免费包。

## 5. Image generation 的合理用法

图像生成适合前期确定方向，不建议直接产出最终 sprite sheet。最终像素动画要求每帧轮廓、调色板、pivot、透明边缘和碰撞框严格一致，生成图通常无法直接满足。

### 建议流程

1. 先生成 3 张概念板，而不是单个散图：
   - 夜市环境色彩与照明；
   - 12 个妖怪剪影；
   - 8 件厨具武器及其元素变体。
2. 选定 1 个方向，建立人工美术规范：16×16 基础 tile、32×32 角色画布、固定 24 色主色板、左上光源、1px 深色描边、最近邻缩放。
3. 像素美术人工重新绘制角色正面/侧面/背面和关键攻击 pose。
4. 用 Aseprite 等工具人工补齐动画，不让生成模型逐帧“猜”。
5. 导出 PNG spritesheet + JSON atlas；逐帧检查透明边、基准点和抖动。

### 可直接给制图工具的概念提示方向

```text
为一款名为《山海夜市》的俯视角像素动作游戏制作概念板。
现代中国夜市混合山海妖怪，雨后湿石路、暖红灯笼、青绿色霓虹、炭火与蒸汽；
整体轻松怪诞、可爱但不幼稚，不使用现成影视或游戏角色。
同一张图展示：摊主英雄、六种轮廓差异明显的小妖怪、锅/菜刀/竹签/炉火/风扇/外卖铃武器、夜宵摊车。
使用受限色板、清楚剪影、正交顶视/四分之三顶视概念，不生成文字，不生成 sprite sheet。
```

概念生成后仍要做原创性复核，避免无意接近知名角色、品牌招牌或其他游戏的标志设计。

## 6. 入库、署名和证据链

### 6.1 目录建议

```text
assets/
  source/                 # 原始下载包，不进入生产构建
  production/             # 清理、统一后的可发布文件
    sprites/
    ui/
    vfx/
    audio/sfx/
    audio/music/
    fonts/
  licenses/
    third-party/
    screenshots/
  manifest.json
ATTRIBUTIONS.md
```

### 6.2 每个素材的最低台账字段

```json
{
  "assetId": "weapon-icon-wok",
  "localPath": "assets/production/ui/icons/wok.png",
  "title": "Wok",
  "author": "Caro Asercion",
  "sourceUrl": "https://game-icons.net/1x1/caro-asercion/wok.html",
  "downloadedAt": "YYYY-MM-DD",
  "license": "CC BY 3.0",
  "licenseUrl": "https://creativecommons.org/licenses/by/3.0/",
  "modified": true,
  "modifications": "redrawn as 24x24 pixel art; recolored",
  "sourceArchiveSha256": "...",
  "creditText": "Wok by Caro Asercion, Game-icons.net, CC BY 3.0; modified."
}
```

### 6.3 入库门禁

- 素材页必须明确给出许可证或 ZIP 内有许可证；只有“free”则拒绝。
- 保存作者页、许可证页、下载日期和原始 ZIP SHA-256。
- 一个包若含第三方内容，按文件/子目录登记；不能用包首页的一句话覆盖全部文件。
- CC BY 的作者、标题、URL、许可链接和修改说明必须能自动生成到 `ATTRIBUTIONS.md` 和游戏 Credits 页面。
- 字体随发布包保留 OFL 文本；不要只保留 CSS 引用。
- Freesound 逐声音登记 ID，不允许只写“Sounds from Freesound”。
- Sonniss 文件与 AI/生成式音频工作目录隔离，防止违反当前 EULA 的 AI 训练禁令。

## 7. 素材接入测试与验收

素材不是下载后就算完成；每类素材接入阶段都应有明确测试。

### 7.1 视觉验收

- 同屏玩家、敌人、地面、UI 只允许一个主像素密度；所有缩放使用 nearest-neighbor。
- 角色四向动画 pivot 不抖动；站立、移动、受击时脚底基线一致。
- 100% 游戏缩放下，普通怪/精英/Boss 只看剪影即可区分。
- 色盲模拟下，稀有度、危险预警和元素状态同时使用形状/纹理，不只使用颜色。
- 720p、1080p、手机竖/横屏截屏检查 UI 九宫格、字体断行与中文缺字。
- 每张 spritesheet 检查透明边、纹理渗色、重复 padding、非法非整数缩放。

### 7.2 性能验收

- 单个常驻图集尽量控制在移动设备可接受范围，避免把 512px 粒子原图和整套未用资产载入首场景。
- 场上 300–500 敌人时，角色动画和粒子不额外创建纹理；重复对象全部引用图集帧。
- 低性能档关闭动态光/降低粒子数后，核心攻击预警仍清楚。
- 首包只含首局需要的角色、敌人、UI 和 1 首 BGM；Boss、结算和图鉴资源按场景懒加载。

### 7.3 音频验收

- Chrome、Safari、Firefox 及 iOS Safari 在首次用户手势后能正常解锁 Web Audio。
- 同一高频命中声至少有 3–5 个变体，随机音高幅度克制，连续攻击不产生“机枪式”疲劳。
- UI、命中、技能、环境、音乐分总线；暂停/切后台恢复时没有叠播或音量跳变。
- 所有循环音乐检查首尾 click；OGG 为主，必要时提供兼容格式；按实际浏览器矩阵验证。
- 以一局 15 分钟为单位试玩，音乐和高频 SFX 不刺耳、不遮蔽 Boss 前摇。

### 7.4 法务验收

- 构建产物中的每个第三方文件都能反查到 manifest 条目。
- `ATTRIBUTIONS.md`、游戏内 Credits 和发布页署名三处由同一台账生成，避免漂移。
- 随机构建抽查 20 个文件，许可证、作者和修改说明准确率 100%。
- 发行冻结时重新打开所有非 CC0 自定义许可证页面；特别复核 Sonniss 的下载日版本。

## 8. 最终采购/制作顺序

1. **立即采用：**Ninja Adventure（原型统一底座）、Kenney UI Pack - Pixel Adventure、Kenney Input Prompts Pixel、Noto Sans SC。
2. **立即建立清单但暂不批量导入：**Game-icons.net 厨具候选；只在武器设计冻结后导入实际使用的 8–12 个并逐项署名。
3. **音频第一轮：**先从 Ninja Adventure、Kenney Interface/Impact/RPG Audio 和 ObsydianX UI 包完成全部事件映射。
4. **第一次原创替换：**玩家 1、Boss 1、主摊车、菜刀/铁锅/炉火三件武器、主标题；它们最影响截图和试玩反馈。
5. **第二次原创替换：**6 类小怪、其余武器/图标、元素特效、完整夜市场景。
6. **音乐与主题音效：**试玩数据证明核心循环成立后，再制作原创主题曲和料理战斗 Foley；Sonniss/Freesound 只填无法自录的缺口。
7. **上线前清理：**从构建中删除所有未使用占位资源，冻结 manifest、许可证快照和 Credits。

这一顺序能让玩法最快可测，同时确保越接近公开发布，画面与声音越属于《山海夜市》本身，而不是素材包的展示工程。
