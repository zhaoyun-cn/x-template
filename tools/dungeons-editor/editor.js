class DungeonEditor {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        // 配置
        this.gridSize = 20;
        this.tileSize = 32;
        this.mapId = 'my_dungeon';
        this.mapName = '我的副本';
        // 副本元素
        this.tiles = {};
        this.spawners = [];
        this.triggers = [];
        this.decorations = [];
        this.entryPoints = [];
        this.bossPoints = [];
        this.cameraBounds = []; // 每个 {x1, y1, x2, y2}
        // 交互状态
        this.currentTool = 'wall';
        this.isDrawing = false;
        this.dragStart = null; // 摄像头区域左上点
        // 绑定&渲染
        this.init();
    }
    init() {
        this.resize();
        this.bindEvents();
        this.render();
        this.updateStats();
    }
    resize() {
        this.canvas.width = this.gridSize * this.tileSize;
        this.canvas.height = this.gridSize * this.tileSize;
    }
    bindEvents() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTool = e.target.dataset.tool;
            });
        });
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        // 操作按钮
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        document.getElementById('fillBorderBtn').addEventListener('click', () => this.fillBorder());
        document.getElementById('exportBtn').addEventListener('click', () => this.export());
        document.getElementById('importBtn').addEventListener('click', () => this.import());
        document.getElementById('gridSize').addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            this.resize();
            this.render();
        });
        document.getElementById('mapId').addEventListener('input', (e) => { this.mapId = e.target.value; });
        document.getElementById('mapName').addEventListener('input', (e) => { this.mapName = e.target.value; });
    }
    gridCoord(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / this.tileSize);
        const y = Math.floor((event.clientY - rect.top) / this.tileSize);
        return { x, y };
    }
    onMouseDown(e) {
        const { x, y } = this.gridCoord(e);
        if (e.button === 0) { // 左键
            switch (this.currentTool) {
                case 'camera':
                    this.dragStart = { x, y };
                    break;
                default:
                    this.isDrawing = true;
                    this.paint(x, y);
            }
        } else if (e.button === 2) { // 右键
            this.erase(x, y);
        }
    }
    onMouseMove(e) {
        const { x, y } = this.gridCoord(e);
        document.getElementById('cellInfo').textContent = `鼠标: (${x}, ${y})`;
        if (this.isDrawing) this.paint(x, y);
        if (this.dragStart && this.currentTool === 'camera') {
            this.render();
            // 预览摄像头区域
            this.ctx.strokeStyle = '#2196F3';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                Math.min(this.dragStart.x, x) * this.tileSize,
                Math.min(this.dragStart.y, y) * this.tileSize,
                (Math.abs(x - this.dragStart.x) + 1) * this.tileSize,
                (Math.abs(y - this.dragStart.y) + 1) * this.tileSize
            );
        }
    }
    onMouseUp(e) {
        this.isDrawing = false;
        if (this.dragStart && this.currentTool === 'camera') {
            const { x, y } = this.gridCoord(e || { clientX: 0, clientY: 0 });
            this.cameraBounds.push({
                x1: Math.min(this.dragStart.x, x),
                y1: Math.min(this.dragStart.y, y),
                x2: Math.max(this.dragStart.x, x),
                y2: Math.max(this.dragStart.y, y)
            });
            this.dragStart = null;
            this.render();
            this.updateStats();
        }
    }
    paint(x, y) {
        const key = `${x},${y}`;
        switch (this.currentTool) {
            case 'wall':
            case 'floor':
                this.tiles[key] = this.currentTool;
                break;
            case 'erase':
                delete this.tiles[key];
                this.removeSpawner(x, y);
                this.removeTrigger(x, y);
                this.removeDecoration(x, y);
                this.removeEntry(x, y);
                this.removeBoss(x, y);
                break;
            case 'kobold':
            case 'ice_shaman':
            case 'troll':
            case 'dragon':
                this.addSpawner(x, y, this.currentTool);
                break;
            case 'trigger':
                this.addTrigger(x, y);
                break;
            case 'chest':
            case 'pillar':
                this.addDecoration(x, y, this.currentTool);
                break;
            case 'entry':
                this.addEntry(x, y);
                break;
            case 'boss':
                this.addBoss(x, y);
                break;
        }
        this.render();
        this.updateStats();
    }
    erase(x, y) {
        const key = `${x},${y}`;
        delete this.tiles[key];
        this.removeSpawner(x, y);
        this.removeTrigger(x, y);
        this.removeDecoration(x, y);
        this.removeEntry(x, y);
        this.removeBoss(x, y);
        this.render();
        this.updateStats();
    }
    addSpawner(x, y, type) {
        this.removeSpawner(x, y);
        const unitTypeMap = {
            'kobold': 'npc_dota_neutral_kobold',
            'ice_shaman': 'npc_dota_neutral_ice_shaman',
            'troll': 'npc_dota_creature_ice_troll',
            'dragon': 'npc_dota_neutral_black_dragon',
        };
        this.spawners.push({
            id: `spawn_${x}_${y}`,
            x, y,
            unitType: unitTypeMap[type],
            count: 1,
            spawnMode: type === 'kobold' ? 'instant' : 'trigger',
        });
    }
    removeSpawner(x, y) { this.spawners = this.spawners.filter(s => !(s.x === x && s.y === y)); }
    addTrigger(x, y) {
        this.removeTrigger(x, y);
        this.triggers.push({
            id: `trigger_${x}_${y}`, x, y,
            radius: 2, event: 'enter', action: `spawn_trigger_${x}_${y}`, oneTime: true,
        });
    }
    removeTrigger(x, y) { this.triggers = this.triggers.filter(t => !(t.x === x && t.y === y)); }
    addDecoration(x, y, type) {
        this.removeDecoration(x, y);
        const modelMap = {
            'chest': 'models/props_gameplay/treasure_chest001.vmdl',
            'pillar': 'models/props_structures/tower_dragon_blk_dest_lvl3.vmdl',
        };
        this.decorations.push({ x, y, model: modelMap[type], scale: 1.0 });
    }
    removeDecoration(x, y) { this.decorations = this.decorations.filter(d => !(d.x === x && d.y === y)); }
    addEntry(x, y) {
        this.removeEntry(x, y);
        this.entryPoints.push({ x, y });
    }
    removeEntry(x, y) { this.entryPoints = this.entryPoints.filter(e => !(e.x === x && e.y === y)); }
    addBoss(x, y) {
        this.removeBoss(x, y);
        this.bossPoints.push({ x, y });
    }
    removeBoss(x, y) { this.bossPoints = this.bossPoints.filter(e => !(e.x === x && e.y === y)); }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 绘制网格
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.gridSize; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.tileSize, 0); this.ctx.lineTo(x * this.tileSize, this.gridSize * this.tileSize); this.ctx.stroke();
        }
        for (let y = 0; y <= this.gridSize; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.tileSize); this.ctx.lineTo(this.gridSize * this.tileSize, y * this.tileSize); this.ctx.stroke();
        }
        // 摄像头区域
        this.cameraBounds.forEach(rect => {
            this.ctx.strokeStyle = '#2196F3';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(rect.x1 * this.tileSize, rect.y1 * this.tileSize, 
                (rect.x2 - rect.x1 + 1) * this.tileSize, (rect.y2 - rect.y1 + 1) * this.tileSize);
        });
        // 地板/墙壁
        for (const [key, type] of Object.entries(this.tiles)) {
            const [x, y] = key.split(',').map(Number);
            if (type === 'wall') this.ctx.fillStyle = '#654321';
            else if (type === 'floor') this.ctx.fillStyle = '#2a2a2a';
            this.ctx.fillRect(x * this.tileSize + 1, y * this.tileSize + 1, this.tileSize - 2, this.tileSize - 2);
        }
        // 刷怪点
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
        for (const spawner of this.spawners) {
            const emoji = spawner.unitType.includes('kobold') ? '👹' :
                          spawner.unitType.includes('ice') ? '❄️' :
                          spawner.unitType.includes('troll') ? '🧟' : '🐲';
            this.ctx.fillText(emoji, spawner.x * this.tileSize + this.tileSize / 2, spawner.y * this.tileSize + this.tileSize / 2);
        }
        // 入口点
        for (const entry of this.entryPoints) {
            this.ctx.fillText('🚪', entry.x * this.tileSize + this.tileSize / 2, entry.y * this.tileSize + this.tileSize / 2);
        }
        // boss点
        for (const boss of this.bossPoints) {
            this.ctx.fillText('👑', boss.x * this.tileSize + this.tileSize / 2, boss.y * this.tileSize + this.tileSize / 2);
        }
        // 触发器
        for (const trigger of this.triggers) {
            this.ctx.fillStyle = 'rgba(255,255,0,0.3)';
            this.ctx.fillRect(trigger.x * this.tileSize, trigger.y * this.tileSize, this.tileSize, this.tileSize);
            this.ctx.fillText('⚡', trigger.x * this.tileSize + this.tileSize / 2, trigger.y * this.tileSize + this.tileSize / 2);
        }
        // 装饰物
        for (const deco of this.decorations) {
            const emoji = deco.model.includes('chest') ? '📦' : '🏛️';
            this.ctx.fillText(emoji, deco.x * this.tileSize + this.tileSize / 2, deco.y * this.tileSize + this.tileSize / 2);
        }
    }
    updateStats() {
        const wallCount = Object.values(this.tiles).filter(t => t === 'wall').length;
        document.getElementById('statsInfo').textContent =
            `墙壁:${wallCount} | 刷怪点:${this.spawners.length} | 入口点:${this.entryPoints.length} | 摄像头区域:${this.cameraBounds.length}`;
    }
    clear() {
        if (confirm('确定要清空地图吗？')) {
            this.tiles = {};
            this.spawners = [];
            this.triggers = [];
            this.decorations = [];
            this.entryPoints = [];
            this.bossPoints = [];
            this.cameraBounds = [];
            this.render();
            this.updateStats();
        }
    }
    fillBorder() {
        for (let x = 0; x < this.gridSize; x++) {
            this.tiles[`${x},0`] = 'wall'; this.tiles[`${x},${this.gridSize - 1}`] = 'wall';
        }
        for (let y = 0; y < this.gridSize; y++) {
            this.tiles[`0,${y}`] = 'wall'; this.tiles[`${this.gridSize - 1},${y}`] = 'wall';
        }
        this.render(); this.updateStats();
    }
    export() {
        const config = {
            mapId: this.mapId,
            mapName: this.mapName,
            width: this.gridSize,
            height: this.gridSize,
            tileSize: 128,
            tiles: [],
            spawners: this.spawners,
            triggers: this.triggers,
            decorations: this.decorations,
            entryPoints: this.entryPoints,
            bossPoints: this.bossPoints,
            cameraBounds: this.cameraBounds, // [{x1, y1, x2, y2}]
        };
        for (const [key, type] of Object.entries(this.tiles)) {
            const [x, y] = key.split(',').map(Number);
            config.tiles.push({ x, y, type });
        }
        const tsContent = `import { DungeonMapData } from '../types';

/** ${this.mapName}
 * 可视化编辑器生成，含入口点/摄像头区域
 * 生成时间: ${new Date().toLocaleString('zh-CN')}
 */
export const DUNGEON_${this.mapId.toUpperCase().replace(/-/g, "_")}: DungeonMapData = ${JSON.stringify(config, null, 4)};
`;
        const blob = new Blob([tsContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dungeon_${this.mapId}.ts`;
        a.click();
        URL.revokeObjectURL(url);
        alert('✅ 配置文件已导出！请放到 game/scripts/src/dungeons/configs/');
    }
    import() {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json,.ts';
        input.onchange = (e) => {
            const file = e.target.files[0]; const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = event.target.result;
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const config = JSON.parse(jsonMatch[0]);
                        this.loadConfig(config); alert('✅ 配置已导入！');
                    }
                } catch (err) { alert('❌ 导入失败: ' + err.message); }
            }; reader.readAsText(file);
        }; input.click();
    }
    loadConfig(config) {
        this.mapId = config.mapId; this.mapName = config.mapName; this.gridSize = config.width;
        document.getElementById('mapId').value = this.mapId;
        document.getElementById('mapName').value = this.mapName;
        document.getElementById('gridSize').value = this.gridSize;
        this.tiles = {}; (config.tiles || []).forEach(tile => { this.tiles[`${tile.x},${tile.y}`] = tile.type; });
        this.spawners = config.spawners || [];
        this.triggers = config.triggers || [];
        this.decorations = config.decorations || [];
        this.entryPoints = config.entryPoints || [];
        this.bossPoints = config.bossPoints || [];
        this.cameraBounds = config.cameraBounds || [];
        this.resize(); this.render(); this.updateStats();
    }
}
const editor = new DungeonEditor();