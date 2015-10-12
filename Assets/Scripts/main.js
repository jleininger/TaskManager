var MainPage = function() {
    var taskViewer = {
        mainContainer: null,
        newTaskContainer: null,
        addBtn: null,
        tables: {
            today: null,
            tomorrow: null,
            next7Days: null,
            future: null
        },
        allTasks: null,

        init: function() {
            this.mainContainer = document.getElementById('mainContainer');
            this.newTaskContainer = document.getElementById('newTaskContainer');
            this.tables['today'] = document.getElementById('todayTaskTable');
            this.tables['tomorrow'] = document.getElementById('tomTaskTable');
            this.tables['next7Days'] = document.getElementById('weekTaskTable');
            this.tables['future'] = document.getElementById('futureTaskTable');
            this.addBtn = document.getElementById('addBtn');
            this.addBtn.addEventListener('click', this.openAddWindow);

            this.getAllTasks(function(tasks) {
                var sortedTasks = taskViewer.sortTasksByDate(tasks);
                taskViewer.displayAllTasks(sortedTasks);
            });
        },
        openAddWindow: function() {
            taskViewer.mainContainer.className = 'hidden';
            taskViewer.newTaskContainer.className = 'visible';
            newTaskWindow.init();
        },
        closeAddWindow: function() {
            taskViewer.mainContainer.className = 'visible';
            taskViewer.newTaskContainer.className = 'hidden';
        },
        saveAllTasks: function() {
            chrome.storage.sync.set({'Tasks': taskViewer.allTasks});
        },
        getAllTasks: function(next) {
            chrome.storage.sync.get('Tasks', function(result) {
                if (chrome.runtime.lastError) {
                    console.error("Unable to retrieve tasks!");
                    return;
                }

                taskViewer.allTasks = result['Tasks'] || [];
                next(taskViewer.allTasks);
            });
        },
        saveTask: function(task) {
            var taskIndex = taskViewer.allTasks.push(task);
            taskViewer.createTaskDisplay(taskViewer.allTasks[taskIndex - 1], taskIndex - 1);
        },
        completeTask: function(index) {
            var currentClass = taskViewer.taskTable.rows[index + 1].className;

            currentClass = (currentClass === 'strikeout') ? '' : 'strikeout';
            taskViewer.taskTable.rows[index + 1].className = currentClass;
        },
        deleteTask: function(index) {
            taskViewer.allTasks.splice(index, 1);
            taskViewer.taskTable.deleteRow(index + 1);
            this.saveAllTasks();
        },
        sortTasksByDate: function(tasks) {
            var tasksByDates = {
                today: [],
                tomorrow: [],
                next7Days: [],
                future: []
                },
                today = new Date(),
                tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                next7Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
;
            for(var i = 0; i < tasks.length; i++) {
                var dueDate = new Date(tasks[i].dueDate),
                    dueTime = tasks[i].dueTime;

                dueDate.setDate(dueDate.getDate() + 1);

                if(dateCalc.compareDay(today, dueDate) === 0) {
                    tasksByDates.today.push(tasks[i]);
                } else if(dateCalc.compareDay(tomorrow, dueDate) === 0) {
                    tasksByDates.tomorrow.push(tasks[i]);
                } else if(dateCalc.compareDay(dueDate, next7Days) < 0) {
                    tasksByDates.next7Days.push(tasks[i]);
                } else {
                    tasksByDates.future.push(tasks[i]);
                }
            }

            return tasksByDates;
        },
        displayAllTasks: function(tasks) {
            for(var taskCategory in tasks) {
                if(tasks.hasOwnProperty(taskCategory)) {
                    for(var i = 0; i < tasks[taskCategory].length; i++) {
                        console.log(tasks[taskCategory]);
                        taskViewer.createTaskDisplay(tasks[taskCategory][i], i, taskViewer.tables[taskCategory]);
                    }
                }
            }
        },
        createTaskDisplay: function(task, index, taskTable) {
            var newRow = taskTable.insertRow(taskTable.length);

            var taskCompleteCell = newRow.insertCell(0);
            var completeCheckBox = document.createElement('input');
            completeCheckBox.type = 'checkbox';
            completeCheckBox.addEventListener('click', function() {
               taskViewer.completeTask(index);
            });
            taskCompleteCell.appendChild(completeCheckBox);

            var taskNameCell = newRow.insertCell(1);
            taskNameCell.innerHTML = task.name;

            var taskDescCell = newRow.insertCell(2);
            taskDescCell.innerHTML = task.desc;

            var taskDueDateCell = newRow.insertCell(3);
            taskDueDateCell.innerHTML = task.dueDate + '@' + task.dueTime;

            var deleteIcon = newRow.insertCell(4);
            var buttonElem = document.createElement('button');
            buttonElem.className = 'close pull-left';
            buttonElem.innerHTML = "<span aria-hidden='true'>&times;</span>";
            buttonElem.addEventListener('click', function() {
                taskViewer.deleteTask(index);
            });
            deleteIcon.appendChild(buttonElem);
        },
        deleteAllTasks: function() {
            chrome.storage.sync.clear(function() {
                console.log("All tasks cleared!");
            });
        }
    };

    var newTaskWindow = {
        newTaskForm: null,
        createBtn: null,
        cancelBtn: null,
        addNewTask: function() {
            var taskName = document.getElementById('taskName').value,
                taskDec = document.getElementById('taskDesc').value,
                taskDueDate = document.getElementById('taskDueDate').value,
                taskDueTime = document.getElementById('taskDueTime').value,
                taskReoccurring = document.getElementById('taskReoccurring').checked;

            var task = newTaskWindow.createTask(taskName, taskDec, taskDueDate, taskDueTime, taskReoccurring);
            taskViewer.saveTask(task);

            taskViewer.closeAddWindow();
            taskViewer.saveAllTasks();
        },
        createTask: function(taskName, taskDesc, taskDueDate, taskDueTime, reoccurring) {
            if(!taskName || taskName === '') {
                window.alert('You must have a name for a new task!');
                return;
            }

            var newTask = {
                name: taskName,
                desc: taskDesc,
                dueDate: taskDueDate,
                dueTime: taskDueTime,
                reoccurring: reoccurring
            };

            return newTask;
        },
        cancelTaskCreation: function() {
            newTaskWindow.newTaskForm.reset();
            taskViewer.closeAddWindow();
        },
        init: function() {
            this.newTaskForm = document.getElementById('newTaskForm');
            this.createBtn = document.getElementById('createBtn');
            this.cancelBtn = document.getElementById('cancelBtn');

            //Listeners
            this.createBtn.addEventListener('click', this.addNewTask);
            this.cancelBtn.addEventListener('click', this.cancelTaskCreation);
        }
    };

    var dateCalc = {
        convert24to12: function() {

        },
        compareDay: function(date1, date2) {
            date1.setHours(0,0,0,0);
            date2.setHours(0,0,0,0);

            if(date1 > date2) {
                return 1;
            } else if(date1 < date2) {
                return -1;
            }

            return 0;
        },
        compareHour: function() {

        },
        sortDates: function() {

        }
    };

    taskViewer.init();
}();