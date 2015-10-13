var MainPage = function() {
    var taskViewer = {
        mainContainer: null,
        newTaskContainer: null,
        addBtn: null,
        tables: {
            overdue: null,
            today: null,
            tomorrow: null,
            next7Days: null,
            future: null
        },
        tasksByDate: {
            lastUpdate: new Date(),
            overdue: [],
            today: [],
            tomorrow: [],
            next7Days: [],
            future: []
        },

        init: function() {
            this.mainContainer = document.getElementById('mainContainer');
            this.newTaskContainer = document.getElementById('newTaskContainer');
            this.tables['overdue'] = document.getElementById('overdueTaskTable');
            this.tables['today'] = document.getElementById('todayTaskTable');
            this.tables['tomorrow'] = document.getElementById('tomTaskTable');
            this.tables['next7Days'] = document.getElementById('weekTaskTable');
            this.tables['future'] = document.getElementById('futureTaskTable');
            this.addBtn = document.getElementById('addBtn');
            this.addBtn.addEventListener('click', this.openAddWindow);

            //taskViewer.deleteAllTasks();
            this.getAllTasks(function(tasks) {
                taskViewer.sortAllTasksByDate(tasks);
                taskViewer.displayAllTasks(taskViewer.tasksByDate);
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
            chrome.storage.sync.set({'Tasks': taskViewer.tasksByDate});
        },
        getAllTasks: function(next) {
            chrome.storage.sync.get('Tasks', function(result) {
                if (chrome.runtime.lastError) {
                    console.error("Unable to retrieve tasks!");
                    return;
                }

                next(result['Tasks'] || taskViewer.tasksByDate);
            });
        },
        saveTask: function(task) {
            var taskDetails = taskViewer.sortTaskByDate(task);
            taskViewer.createTaskDisplay(task, taskDetails.index, taskDetails.tableType);
        },
        completeTask: function(index, taskType) {
            var task = taskViewer.tasksByDate[taskType][(taskType === 'today') ? index - 1 : index];
            task.complete = !task.complete;

            var currentClass = taskViewer.tables[taskType].rows[index].className;
            currentClass = (currentClass === 'strikeout') ? '' : 'strikeout';
            taskViewer.tables[taskType].rows[index].className = currentClass;
            this.saveAllTasks();
        },
        deleteTask: function(index, taskType) {
            if(taskType === 'today') { index += 1; }
            taskViewer.tasksByDate[taskType].splice(index, 1);
            taskViewer.tables[taskType].deleteRow(index);
            this.saveAllTasks();
        },
        sortAllTasksByDate: function(tasks) {
            var taskHolder = [];
            taskHolder = taskHolder.concat(tasks.overdue);
            taskHolder = taskHolder.concat(tasks.today);
            taskHolder = taskHolder.concat(tasks.tomorrow);
            taskHolder = taskHolder.concat(tasks.next7Days);
            taskHolder = taskHolder.concat(tasks.future);

            for(var i = 0; i < taskHolder.length; i++) {
                taskViewer.sortTaskByDate(taskHolder[i]);
            }
        },
        sortTaskByDate: function(task) {
            //TODO: Creating multiple date objects, possibly slow may need refactor
            var dueDate = new Date(task.dueDate),
                today = new Date(),
                tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                next7Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
                taskDetails = {
                    index: 0,
                    tableType: 'not set'
                };

            //Dates end up being a day behind for some reason; quick fix
            dueDate.setDate(dueDate.getDate() + 1);

            if(dateCalc.compareDay(today, dueDate) > 0) {
                if(!task.complete)  {
                    taskDetails.index = taskViewer.tasksByDate.overdue.push(task);
                    taskDetails.tableType = "overdue";
                }
            } else if(dateCalc.compareDay(today, dueDate) === 0) {
                taskDetails.index = taskViewer.tasksByDate.today.push(task);
                taskDetails.tableType = 'today';
            } else if(dateCalc.compareDay(tomorrow, dueDate) === 0) {
                taskDetails.index = taskViewer.tasksByDate.tomorrow.push(task);
                taskDetails.tableType = 'tomorrow';
            } else if(dateCalc.compareDay(dueDate, next7Days) < 0) {
                taskDetails.index = taskViewer.tasksByDate.next7Days.push(task);
                taskDetails.tableType = 'next7Days';
            } else {
                taskDetails.index = taskViewer.tasksByDate.future.push(task);
                taskDetails.tableType = 'future';
            }

            return taskDetails;
        },
        displayAllTasks: function(tasks) {
            for(var taskCategory in tasks) {
                if(tasks.hasOwnProperty(taskCategory)) {
                    for(var i = 0; i < tasks[taskCategory].length; i++) {
                        taskViewer.createTaskDisplay(tasks[taskCategory][i], i, taskCategory);
                    }
                }
            }
        },
        createTaskDisplay: function(task, index, taskCategory) {
            var newRow = taskViewer.tables[taskCategory].insertRow(taskViewer.tables[taskCategory].length);

            if(taskCategory === "overdue") { newRow.className += 'danger'; }

            var taskCompleteCell = newRow.insertCell(0);
            var completeCheckBox = document.createElement('input');
            completeCheckBox.type = 'checkbox';
            completeCheckBox.addEventListener('click', function() {
               taskViewer.completeTask(newRow.rowIndex, taskCategory);
            });
            if(task.complete) {
                newRow.className += ' strikeout';
                completeCheckBox.checked = true;
            }
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
                taskViewer.deleteTask(index, taskCategory);
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
                reoccurring: reoccurring,
                completed: false
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