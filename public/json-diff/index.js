/**
 * JSON 比对工具 - 优化版本
 * 核心功能：
 * 1. JSON 格式化 + key 排序
 * 2. 过滤完全相同字段（左右两边 key 和 value 都相同）
 * 3. 过滤类型相同字段（左右两边 key 和类型都相同）
 * 4. 过滤时直接修改 JSON 数据并重新渲染
 */

// 创建 Vue 实例并暴露到全局供事件处理使用
window.vueApp = new Vue({
    el: '#pageContainer',
    data: {
        errorMessage: '',
        tipMessage: 'Tips：',
        errorHighlight: false,
        hasErrorClass: false,
        leftSideError: false,
        rightSideError: false,
        differenceCount: 0,
        isDifferent: false,
        filterExact: false, // 过滤 key,value 完全相同的字段
        filterType: false,  // 过滤 key 相同且类型相同的字段
        // 存储原始 JSON 数据（用于过滤时重新计算）
        originalLeftJson: null,
        originalRightJson: null,
        jsonExamples: {
            userInfo: {
                left: {
                    "id": 1001,
                    "name": "张三",
                    "age": 28,
                    "email": "zhangsan@example.com",
                    "address": {
                        "city": "北京",
                        "district": "朝阳区",
                        "street": "建国路 88 号"
                    },
                    "tags": ["前端", "JavaScript", "Vue"],
                    "isActive": true,
                    "lastLogin": "2023-01-15T08:30:00Z"
                },
                right: {
                    "id": 1001,
                    "name": "张三",
                    "age": 30,
                    "email": "zhangsan@example.com",
                    "address": {
                        "city": "上海",
                        "district": "浦东新区",
                        "street": "建国路 88 号"
                    },
                    "tags": ["前端", "JavaScript", "React"],
                    "isActive": true,
                    "lastLogin": "2023-02-20T10:45:00Z"
                }
            },
            productData: {
                left: {
                    "products": [
                        {
                            "id": "p001",
                            "name": "智能手机",
                            "price": 4999,
                            "inventory": 100,
                            "category": "电子产品",
                            "specs": {
                                "brand": "小米",
                                "model": "Mi 11",
                                "color": "黑色",
                                "storage": "128GB"
                            }
                        },
                        {
                            "id": "p002",
                            "name": "笔记本电脑",
                            "price": 6999,
                            "inventory": 50,
                            "category": "电子产品",
                            "specs": {
                                "brand": "联想",
                                "model": "ThinkPad",
                                "color": "银色",
                                "storage": "512GB"
                            }
                        }
                    ]
                },
                right: {
                    "products": [
                        {
                            "id": "p001",
                            "name": "智能手机",
                            "price": 5299,
                            "inventory": 85,
                            "category": "电子产品",
                            "specs": {
                                "brand": "小米",
                                "model": "Mi 11 Pro",
                                "color": "蓝色",
                                "storage": "256GB"
                            }
                        },
                        {
                            "id": "p002",
                            "name": "笔记本电脑",
                            "price": 6999,
                            "inventory": 50,
                            "category": "电子产品",
                            "specs": {
                                "brand": "联想",
                                "model": "ThinkPad",
                                "color": "银色",
                                "storage": "512GB"
                            }
                        }
                    ]
                }
            },
            configOptions: {
                left: {
                    "appConfig": {
                        "theme": "light",
                        "language": "zh-CN",
                        "notifications": {
                            "email": true,
                            "push": true,
                            "sms": false
                        },
                        "security": {
                            "twoFactorAuth": true,
                            "passwordExpiry": 90,
                            "ipRestriction": false
                        },
                        "performance": {
                            "cacheEnabled": true,
                            "compressionLevel": "high",
                            "preload": ["home", "dashboard"]
                        }
                    }
                },
                right: {
                    "appConfig": {
                        "theme": "dark",
                        "language": "zh-CN",
                        "notifications": {
                            "email": true,
                            "push": false,
                            "sms": true
                        },
                        "security": {
                            "twoFactorAuth": true,
                            "passwordExpiry": 60,
                            "ipRestriction": true
                        },
                        "performance": {
                            "cacheEnabled": true,
                            "compressionLevel": "medium",
                            "preload": ["home", "profile", "dashboard"]
                        }
                    }
                }
            },
            apiResponse: {
                left: {
                    "status": "success",
                    "code": 200,
                    "data": {
                        "users": [
                            {"id": 1, "name": "李明", "role": "admin"},
                            {"id": 2, "name": "王芳", "role": "user"},
                            {"id": 3, "name": "赵强", "role": "editor"}
                        ],
                        "pagination": {
                            "total": 25,
                            "page": 1,
                            "limit": 10
                        },
                        "timestamp": 1642558132,
                        "version": "1.0.0"
                    }
                },
                right: {
                    "status": "success",
                    "code": 200,
                    "data": {
                        "users": [
                            {"id": 1, "name": "李明", "role": "admin"},
                            {"id": 2, "name": "王芳", "role": "user"},
                            {"id": 3, "name": "赵强", "role": "moderator"}
                        ],
                        "pagination": {
                            "total": 28,
                            "page": 1,
                            "limit": 10
                        },
                        "timestamp": 1652558132,
                        "version": "1.2.0"
                    }
                }
            }
        }
    },
    computed: {
        displayMessage: function() {
            return this.tipMessage + this.errorMessage;
        }
    },
    methods: {
        // 填充示例数据
        fillExample: function(exampleType) {
            if (this.jsonExamples[exampleType]) {
                const example = this.jsonExamples[exampleType];
                // 存储原始数据
                this.originalLeftJson = this.deepClone(example.left);
                this.originalRightJson = this.deepClone(example.right);
                
                // 格式化并排序后显示
                const formattedLeft = this.formatAndSortJson(example.left);
                const formattedRight = this.formatAndSortJson(example.right);
                
                jsonBox.left.setValue(JSON.stringify(formattedLeft, null, 4));
                jsonBox.right.setValue(JSON.stringify(formattedRight, null, 4));

                // 触发比对
                setTimeout(() => {
                    jsonBox.left.refresh();
                    jsonBox.right.refresh();
                    this.compareJson();
                }, 100);
            }
        },
        
        // 格式化 + 排序 JSON
        formatJson: function() {
            const leftText = jsonBox.left.getValue();
            const rightText = jsonBox.right.getValue();
            
            try {
                if (leftText.trim()) {
                    const leftJson = JSON.parse(leftText);
                    this.originalLeftJson = this.deepClone(leftJson);
                    const formatted = this.formatAndSortJson(leftJson);
                    jsonBox.left.setValue(JSON.stringify(formatted, null, 4));
                }
            } catch (e) {
                console.error('左侧 JSON 解析失败:', e);
            }
            
            try {
                if (rightText.trim()) {
                    const rightJson = JSON.parse(rightText);
                    this.originalRightJson = this.deepClone(rightJson);
                    const formatted = this.formatAndSortJson(rightJson);
                    jsonBox.right.setValue(JSON.stringify(formatted, null, 4));
                }
            } catch (e) {
                console.error('右侧 JSON 解析失败:', e);
            }
            
            setTimeout(() => {
                jsonBox.left.refresh();
                jsonBox.right.refresh();
                this.compareJson();
            }, 100);
        },
        
        // 过滤条件变化时触发
        onFilterChange: function() {
            // 互斥逻辑：两个过滤条件不能同时开启
            if (this.filterExact && this.filterType) {
                this.filterType = false;
            }
            
            // 重新应用过滤并比对
            this.applyFilterAndCompare();
        },
        
        // 应用过滤并比对
        applyFilterAndCompare: function() {
            if (!this.originalLeftJson || !this.originalRightJson) {
                // 如果没有原始数据，先尝试解析当前编辑器内容
                const leftText = jsonBox.left.getValue();
                const rightText = jsonBox.right.getValue();
                
                try {
                    if (leftText.trim()) {
                        this.originalLeftJson = JSON.parse(leftText);
                    }
                } catch (e) {}
                
                try {
                    if (rightText.trim()) {
                        this.originalRightJson = JSON.parse(rightText);
                    }
                } catch (e) {}
            }
            
            if (!this.originalLeftJson || !this.originalRightJson) {
                this.compareJson();
                return;
            }
            
            // 根据过滤条件生成新的 JSON
            let filteredLeft = this.deepClone(this.originalLeftJson);
            let filteredRight = this.deepClone(this.originalRightJson);
            
            if (this.filterExact) {
                // 过滤完全相同字段
                const result = this.filterSameFields(filteredLeft, filteredRight, 'exact');
                filteredLeft = result.left;
                filteredRight = result.right;
            } else if (this.filterType) {
                // 过滤类型相同字段
                const result = this.filterSameFields(filteredLeft, filteredRight, 'type');
                filteredLeft = result.left;
                filteredRight = result.right;
            }
            
            // 更新编辑器内容
            jsonBox.left.setValue(JSON.stringify(filteredLeft, null, 4));
            jsonBox.right.setValue(JSON.stringify(filteredRight, null, 4));
            
            setTimeout(() => {
                jsonBox.left.refresh();
                jsonBox.right.refresh();
                this.compareJson();
            }, 100);
        },
        
        // 格式化并排序 JSON（递归处理对象和数组）
        formatAndSortJson: function(obj) {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            
            if (Array.isArray(obj)) {
                // 数组：递归处理每个元素
                return obj.map(item => this.formatAndSortJson(item));
            }
            
            // 对象：按 key 排序后递归处理
            const sortedObj = {};
            const keys = Object.keys(obj).sort();
            for (const key of keys) {
                sortedObj[key] = this.formatAndSortJson(obj[key]);
            }
            return sortedObj;
        },
        
        // 过滤相同字段
        filterSameFields: function(leftObj, rightObj, filterMode) {
            // 创建新对象存储过滤后的结果
            const filteredLeft = this.deepClone(leftObj);
            const filteredRight = this.deepClone(rightObj);
            
            // 递归过滤
            this.filterObject(filteredLeft, filteredRight, filterMode);
            
            return { left: filteredLeft, right: filteredRight };
        },
        
        // 递归过滤对象
        filterObject: function(leftObj, rightObj, filterMode) {
            if (leftObj === null || rightObj === null || 
                typeof leftObj !== 'object' || typeof rightObj !== 'object') {
                return;
            }
            
            // 如果类型不同，不进行过滤
            const leftIsArray = Array.isArray(leftObj);
            const rightIsArray = Array.isArray(rightObj);
            
            if (leftIsArray !== rightIsArray) {
                return;
            }
            
            // 处理数组
            if (leftIsArray) {
                // 数组长度不同，不进行过滤
                if (leftObj.length !== rightObj.length) {
                    return;
                }
                // 递归处理数组元素
                for (let i = 0; i < leftObj.length; i++) {
                    if (typeof leftObj[i] === 'object' && leftObj[i] !== null &&
                        typeof rightObj[i] === 'object' && rightObj[i] !== null) {
                        this.filterObject(leftObj[i], rightObj[i], filterMode);
                    }
                }
                return;
            }
            
            // 处理对象
            const leftKeys = Object.keys(leftObj);
            const rightKeys = Object.keys(rightObj);
            const allKeys = new Set([...leftKeys, ...rightKeys]);
            
            for (const key of allKeys) {
                const leftValue = leftObj[key];
                const rightValue = rightObj[key];
                
                // 检查 key 是否同时存在于两边
                if (key in leftObj && key in rightObj) {
                    // 检查是否需要过滤
                    let shouldFilter = false;
                    
                    if (filterMode === 'exact') {
                        // 完全相同过滤：key 和 value 都相同
                        if (JSON.stringify(leftValue) === JSON.stringify(rightValue)) {
                            shouldFilter = true;
                        }
                    } else if (filterMode === 'type') {
                        // 类型相同过滤：key 相同且类型相同
                        if (this.getType(leftValue) === this.getType(rightValue)) {
                            shouldFilter = true;
                        }
                    }
                    
                    // 如果需要过滤，从两边都删除这个 key
                    if (shouldFilter) {
                        delete leftObj[key];
                        delete rightObj[key];
                    } else if (typeof leftValue === 'object' && leftValue !== null &&
                               typeof rightValue === 'object' && rightValue !== null) {
                        // 递归处理子对象
                        this.filterObject(leftValue, rightValue, filterMode);
                    }
                }
            }
        },
        
        // 比对 JSON
        compareJson: function() {
            let leftText = jsonBox.left.getValue();
            let rightText = jsonBox.right.getValue();
            let leftJson, rightJson;

            try {
                if (leftText) {
                    leftJson = JSON.parse(leftText);
                }
                this.errorHandler('left', true);
            } catch (e) {
                console.log('left ==>', e);
                this.errorHandler('left', false);
                return;
            }

            try {
                if (rightText) {
                    rightJson = JSON.parse(rightText);
                }
                this.errorHandler('right', true);
            } catch (e) {
                console.log('right ==>', e);
                this.errorHandler('right', false);
                return;
            }

            if (!leftJson || !rightJson) {
                if (!leftJson && !rightJson) {
                    this.errorHandler('left-right', false);
                } else if (!leftJson) {
                    this.errorHandler('left', false);
                } else {
                    this.errorHandler('right', false);
                }
                return;
            }

            try {
                // 调用 jsonpatch 的 compare 方法进行比对
                let diffs = jsonpatch.compare(leftJson, rightJson);
                this.diffHandler(diffs);

                // 清除所有之前的标记
                this.clearMarkers();

                // 高亮差异
                diffs.forEach((diff) => {
                    try {
                        if (diff.op === 'remove') {
                            this.highlightDiff(diff, 'remove');
                        } else if (diff.op === 'add') {
                            this.highlightDiff(diff, 'add');
                        } else if (diff.op === 'replace') {
                            this.highlightDiff(diff, 'replace');
                        }
                    } catch (e) {
                        console.warn('error while trying to highlight diff', e);
                    }
                });
            } catch (e) {
                console.error('比对过程出错:', e);
            }
        },
        
        // 深拷贝
        deepClone: function(obj) {
            return JSON.parse(JSON.stringify(obj));
        },
        
        // 获取类型
        getType: function(value) {
            if (value === null) return 'null';
            if (value === undefined) return 'undefined';
            if (Array.isArray(value)) return 'array';
            return typeof value;
        },
        
        // 清除所有标记
        clearMarkers: function() {
            jsonBox.left.getAllMarks().forEach(function(marker) {
                marker.clear();
            });
            jsonBox.right.getAllMarks().forEach(function(marker) {
                marker.clear();
            });
        },
        
        // 高亮差异
        highlightDiff: function(diff, op) {
            if (op === 'remove') {
                this.highlightRemoval(jsonBox.left, diff);
            } else if (op === 'add') {
                this.highlightAddition(jsonBox.right, diff);
            } else if (op === 'replace') {
                this.highlightChange(jsonBox.left, diff);
                this.highlightChange(jsonBox.right, diff);
            }
        },
        
        // 高亮删除
        highlightRemoval: function(editor, diff) {
            this._highlight(editor, diff, '#DD4444');
        },
        
        // 高亮添加
        highlightAddition: function(editor, diff) {
            this._highlight(editor, diff, '#4ba2ff');
        },
        
        // 高亮修改
        highlightChange: function(editor, diff) {
            this._highlight(editor, diff, '#E5E833');
        },
        
        // 高亮辅助方法
        _highlight: function(editor, diff, color) {
            try {
                let textValue = editor.getValue();
                let result = jsonSourceMap.parse(textValue);
                let pointers = result.pointers;
                let path = diff.path;

                if (!pointers[path]) {
                    console.warn('找不到路径的指针:', path);
                    return;
                }

                let start = {
                    line: pointers[path].key ? pointers[path].key.line : pointers[path].value.line,
                    ch: pointers[path].key ? pointers[path].key.column : pointers[path].value.column
                };
                let end = {
                    line: pointers[path].valueEnd.line,
                    ch: pointers[path].valueEnd.column
                };

                editor.markText(start, end, {
                    css: 'background-color: ' + color
                });
            } catch (e) {
                console.error('高亮过程出错:', e);
            }
        },
        
        // 错误处理
        errorHandler: function(which, ok) {
            if (ok) {
                this.errorMessage = '两侧 JSON 比对完成！';
                this.errorHighlight = false;
                this.leftSideError = false;
                this.rightSideError = false;
            } else {
                let side = {'left': '左', 'right': '右', 'left-right': '两'}[which];
                if(!jsonBox.left.getValue().trim().length) {
                    this.errorMessage = '请在左侧填入待比对的 JSON 内容！';
                    this.leftSideError = true;
                    this.rightSideError = false;
                }else if(!jsonBox.right.getValue().trim().length) {
                    this.errorMessage = '请在右侧填入待比对的 JSON 内容！';
                    this.leftSideError = false;
                    this.rightSideError = true;
                }else{
                    this.errorMessage = side + '侧 JSON 不合法！';
                    if (which === 'left') {
                        this.leftSideError = true;
                        this.rightSideError = false;
                    } else if (which === 'right') {
                        this.leftSideError = false;
                        this.rightSideError = true;
                    } else {
                        this.leftSideError = true;
                        this.rightSideError = true;
                    }
                }
                this.errorHighlight = true;
            }
        },
        
        // diff 处理器
        diffHandler: function(diffs) {
            if (!this.errorHighlight) {
                this.differenceCount = diffs.length;
                this.isDifferent = diffs.length > 0;
                if (diffs.length) {
                    this.errorMessage += '共有 ' + diffs.length + ' 处不一致！';
                } else {
                    this.errorMessage += '且 JSON 内容一致！';
                }
            }
        },

        // 打开工具市场页面
        openOptionsPage: function(event){
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        },

        openDonateModal: function(event){
            event.preventDefault();
            event.stopPropagation();
            if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'open-donate-modal',
                    params: { toolName: 'json-diff' }
                });
            } else {
                console.log('打赏功能仅在扩展环境中可用');
            }
        },

        loadPatchHotfix() {
            if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
                console.log('补丁热修复功能仅在扩展环境中可用');
                return;
            }

            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'json-diff'
            }, patch => {
                if (patch) {
                    if (patch.css) {
                        const style = document.createElement('style');
                        style.textContent = patch.css;
                        document.head.appendChild(style);
                    }
                    if (patch.js) {
                        try {
                            if (window.evalCore && window.evalCore.getEvalInstance) {
                                window.evalCore.getEvalInstance(patch.js)();
                            }
                        } catch (e) {
                            console.error('执行补丁 JS 失败:', e);
                        }
                    }
                }
            });
        },

        // 添加粘贴事件监听
        addPasteListener: function(editor) {
            editor.on('paste', (instance, event) => {
                // 获取粘贴的文本
                const pastedText = event.clipboardData.getData('text');
                if (!pastedText) return;

                // 尝试解析 JSON
                try {
                    const json = JSON.parse(pastedText);
                    // 格式化并排序
                    const formatted = this.formatAndSortJson(json);
                    const formattedStr = JSON.stringify(formatted, null, 4);

                    // 阻止默认粘贴行为
                    event.preventDefault();

                    // 替换为格式化后的内容
                    editor.replaceSelection(formattedStr);

                    // 存储原始数据
                    if (editor === jsonBox.left) {
                        this.originalLeftJson = this.deepClone(json);
                    } else {
                        this.originalRightJson = this.deepClone(json);
                    }

                    // 触发比对
                    setTimeout(() => {
                        this.compareJson();
                    }, 100);
                } catch (e) {
                    // 不是有效 JSON，使用默认粘贴行为
                    console.log('粘贴内容不是有效 JSON，使用默认粘贴');
                }
            });
        }
    },
    mounted: function() {
        // 初始化 JSON 编辑器
        let jsonBox = JsonDiff.init(this.$refs.srcLeft, this.$refs.srcRight,
            this.errorHandler.bind(this),
            this.diffHandler.bind(this)
        );

        // 添加比较方法
        jsonBox.compare = this.compareJson.bind(this);

        // 初始化文本变更监听
        jsonBox.left.on('change', () => {
            setTimeout(() => this.compareJson(), 300);
        });
        jsonBox.right.on('change', () => {
            setTimeout(() => this.compareJson(), 300);
        });

        // 添加粘贴事件监听 - 自动格式化 + 排序
        this.addPasteListener(jsonBox.left);
        this.addPasteListener(jsonBox.right);

        // 暴露到全局，供示例数据使用
        window.jsonBox = jsonBox;

        this.loadPatchHotfix();
    }
});
