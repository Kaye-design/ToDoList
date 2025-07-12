// 任務管理應用
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.chart = null;
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.updateStats();
        this.renderTasks();
        this.initChart();
        this.setDefaultDate();
    }

    // 設置默認日期為今天
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dueDate').value = today;
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 新增任務表單
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // 編輯任務表單
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTask();
        });

        // 過濾按鈕
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // 模態框關閉
        document.querySelector('.close').addEventListener('click', () => {
            this.closeEditModal();
        });

        // 點擊模態框外部關閉
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeEditModal();
            }
        });
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 新增任務
    addTask() {
        const taskName = document.getElementById('taskName').value.trim();
        const dueDate = document.getElementById('dueDate').value;
        const progress = parseFloat(document.getElementById('progress').value) || 0;
        const notes = document.getElementById('notes').value.trim();

        if (!taskName || !dueDate) {
            alert('請填寫任務名稱和截止日期！');
            return;
        }

        const task = {
            id: this.generateId(),
            name: taskName,
            dueDate: dueDate,
            progress: progress,
            notes: notes,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.updateStats();
        this.renderTasks();
        this.updateChart();
        this.resetForm();
    }

    // 重置表單
    resetForm() {
        document.getElementById('taskForm').reset();
        this.setDefaultDate();
    }

    // 編輯任務
    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        document.getElementById('editId').value = task.id;
        document.getElementById('editTaskName').value = task.name;
        document.getElementById('editDueDate').value = task.dueDate;
        document.getElementById('editProgress').value = task.progress;
        document.getElementById('editNotes').value = task.notes;

        document.getElementById('editModal').style.display = 'block';
    }

    // 更新任務
    updateTask() {
        const id = document.getElementById('editId').value;
        const task = this.tasks.find(t => t.id === id);
        
        if (!task) return;

        task.name = document.getElementById('editTaskName').value.trim();
        task.dueDate = document.getElementById('editDueDate').value;
        task.progress = parseFloat(document.getElementById('editProgress').value) || 0;
        task.notes = document.getElementById('editNotes').value.trim();

        this.saveTasks();
        this.updateStats();
        this.renderTasks();
        this.updateChart();
        this.closeEditModal();
    }

    // 刪除任務
    deleteTask(id) {
        if (confirm('確定要刪除這個任務嗎？')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.updateStats();
            this.renderTasks();
            this.updateChart();
        }
    }

    // 關閉編輯模態框
    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    // 設置過濾器
    setFilter(filter) {
        this.currentFilter = filter;
        
        // 更新按鈕狀態
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }

    // 獲取過濾後的任務
    getFilteredTasks() {
        const today = new Date().toISOString().split('T')[0];
        
        switch (this.currentFilter) {
            case 'today':
                return this.tasks.filter(task => task.dueDate === today);
            case 'overdue':
                return this.tasks.filter(task => task.dueDate < today && task.progress < 100);
            case 'completed':
                return this.tasks.filter(task => task.progress >= 100);
            default:
                return this.tasks;
        }
    }

    // 渲染任務列表
    renderTasks() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<div class="no-tasks">暫無任務</div>';
            return;
        }

        taskList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
    }

    // 創建任務HTML
    createTaskHTML(task) {
        const today = new Date().toISOString().split('T')[0];
        const isOverdue = task.dueDate < today && task.progress < 100;
        const isTodayDue = task.dueDate === today;
        const isCompleted = task.progress >= 100;

        let className = 'task-item';
        if (isOverdue) className += ' overdue';
        else if (isTodayDue) className += ' today-due';
        else if (isCompleted) className += ' completed';

        const progressClass = this.getProgressClass(task.progress);

        return `
            <div class="${className}" data-id="${task.id}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.name}</div>
                        <div class="task-due">截止日期: ${this.formatDate(task.dueDate)}</div>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn edit-btn" onclick="taskManager.editTask('${task.id}')">
                            <i class="fas fa-edit"></i> 編輯
                        </button>
                        <button class="action-btn delete-btn" onclick="taskManager.deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i> 刪除
                        </button>
                    </div>
                </div>
                
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${task.progress}%"></div>
                    </div>
                    <div class="progress-text">${task.progress}%</div>
                </div>
                
                ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
            </div>
        `;
    }

    // 獲取進度顏色類別
    getProgressClass(progress) {
        if (progress < 20) return 'low';
        if (progress < 80) return 'medium';
        return 'high';
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 更新統計信息
    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.progress >= 100).length;
        const todayDue = this.tasks.filter(t => t.dueDate === today).length;
        const overdueTasks = this.tasks.filter(t => t.dueDate < today && t.progress < 100).length;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('todayDue').textContent = todayDue;
        document.getElementById('overdueTasks').textContent = overdueTasks;
    }

    // 初始化圖表
    initChart() {
        const ctx = document.getElementById('progressChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: '完成進度',
                    data: [],
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        this.updateChart();
    }

    // 更新圖表
    updateChart() {
        if (!this.chart) return;

        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.tasks.filter(t => t.dueDate === today);
        
        if (todayTasks.length === 0) {
            this.chart.data.labels = ['今日無任務'];
            this.chart.data.datasets[0].data = [0];
        } else {
            this.chart.data.labels = todayTasks.map(t => t.name);
            this.chart.data.datasets[0].data = todayTasks.map(t => t.progress);
            
            // 根據進度設置顏色
            this.chart.data.datasets[0].backgroundColor = todayTasks.map(t => {
                if (t.progress < 20) return 'rgba(220, 53, 69, 0.8)';
                if (t.progress < 80) return 'rgba(0, 123, 255, 0.8)';
                return 'rgba(40, 167, 69, 0.8)';
            });
        }

        this.chart.update();
    }

    // 保存任務到本地存儲
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // 從本地存儲加載任務
    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
    }

    // 自動清理完成的任務（可選功能）
    autoCleanCompletedTasks() {
        const completedTasks = this.tasks.filter(t => t.progress >= 100);
        if (completedTasks.length > 0) {
            if (confirm(`發現 ${completedTasks.length} 個已完成任務，是否要清理？`)) {
                this.tasks = this.tasks.filter(t => t.progress < 100);
                this.saveTasks();
                this.updateStats();
                this.renderTasks();
                this.updateChart();
            }
        }
    }
}

// 全局變量
let taskManager;

// 頁面加載完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
    
    // 每小時檢查一次是否需要清理完成的任務
    setInterval(() => {
        taskManager.autoCleanCompletedTasks();
    }, 3600000); // 1小時
});

// 全局函數供HTML調用
function closeEditModal() {
    taskManager.closeEditModal();
} 