$(document).ready(function() {

    function checkWidth() {
        if($(window).width() >= 768){
            $('.side-panel').show();
            $('#taskListContainer').addClass('indent-side');
        } else {
            $('.side-panel').hide();
            $('#taskListContainer').removeClass('indent-side');
            //TODO Show categories in the left slide menu
        }
    }
    // Execute on load
    checkWidth();
    // Bind event listener
    $(window).resize(checkWidth);
});

$(function() {

    /********************
     *     Constants    *
     ********************/
    var listItemTransparency = 0.95;
     
    var COLORS = {
        NEW_STATE: 'rgba(255,255,255,'+listItemTransparency+')',
        STARTED_STATE: 'rgba(255,255,170,'+listItemTransparency+')',
        COMPLETED_STATE: 'rgba(212,255,170,'+listItemTransparency+')',
    };
    
    var TASK_COMPLEXITY_CLASS = {
        SMALL: 'small-task',
        MEDIUM: 'medium-task',
        LARGE: 'large-task',
    };
    
    var TASK_COMPLEXITY_VALUE = {
        SMALL: 'S',
        MEDIUM: 'M',
        LARGE: 'L',
    }
    
    var DAY_OF_WEEK_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var MONTH_NAMES = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
    
    var TASK_LIST_ID = '#sortableTodo';
    var COMPLETED_TASK_LIST_ID = '#sortableCompleted';
    
    var ALL_CATEGORIES_LABEL = 'All';
    var UNASSIGNED_CATEGORIES_LABEL = 'Unassigned';
    
    var ADD_CATEGORY_PREFIX = 'add-';
    var DELETE_CATEGORY_PREFIX = 'delete-';
    
    var HOST_PREFIX = "http://YOUR-HOST/task-list/";
    
    var GET_TASK_LIST_URL = HOST_PREFIX+"get-task-list.php";
    var SAVE_TASK_LIST_URL = HOST_PREFIX+"save-task-list.php";
    var SAVE_TASK_LIST_ORDER_URL = HOST_PREFIX+"save-task-list-order.php";
    var ADD_TASK_URL = HOST_PREFIX+"add-task.php";
    var GET_CATEGORIES_URL = HOST_PREFIX+"get-categories.php";
    var ADD_CATEGORY_URL = HOST_PREFIX+"add-category.php";
    var DELETE_CATEGORY_URL = HOST_PREFIX+"delete-category.php";
    var RENAME_CATEGORY_URL = HOST_PREFIX+"rename-category.php";
    var GET_CATEGORIZED_TASKS_URL = HOST_PREFIX+"get-categorized-tasks.php";
    var ADD_CATEGORY_TO_TASK_URL = HOST_PREFIX+"add-category-to-task.php";
    var REMOVE_CATEGORY_FROM_TASK_URL = HOST_PREFIX+"remove-category-from-task.php";
    /********************
     *     Functions    *
     ********************/
    /*console.logCopy = console.log.bind(console);
    console.log = function(data)
    {
        var timestamp = '[' + Date.now() + '] ';
        this.logCopy(timestamp, data);
    };*/
    
    /********************
     * Getter Functions *
     ********************/
    
    var getFirstDayOfThisWeek = function(){
        var curr = new Date; // get current date
        var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
        return new Date(curr.setDate(first));
    }
    
    var getLastDayOfThisWeek = function(){
        var curr = new Date; // get current date
        var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
        var last = first + 6; // last day is the first day + 6
        return new Date(curr.setDate(last));
    }
    var getTaskList = function(){
        var taskListIndex = localStorage.getItem('taskListIndex');
        return JSON.parse(localStorage.getItem('taskList-' +taskListIndex));
    }
    
    /**
     * Retrieves the taskListOrder from localStorage, returns null if not found.
     * This value is not always up to date! 
     */
    var getTaskListOrder = function(){
        var taskListOrderIndex = localStorage.getItem('taskListOrderIndex');
        var taskListOrderString = localStorage.getItem('taskListOrder-' +taskListOrderIndex);
        if(taskListOrderString){
            return JSON.parse(taskListOrderString);
        } else {
            return taskListOrderString;
        }
    }
    
    /**
     * Constructs the taskListOrder based on the html sortable elements
     */
    var getCurrentTaskListOrder = function(){
        var taskListOrder = $(TASK_LIST_ID).sortable('toArray');
        var completedListOrder = $(COMPLETED_TASK_LIST_ID).sortable('toArray');
        var combinedOrder = $.merge( taskListOrder , completedListOrder );
        return combinedOrder;
    }
    
    var getCategories = function(){
        return JSON.parse(localStorage.getItem('categories'));
    }
    
    /**
     * Get a color String depending on the task state
     * @param state - String
     * @return String
     */
    var getColorOfState = function(state) {
        if(state === 'new'){
            return COLORS.NEW_STATE;
        } else if(state === 'started'){
            return COLORS.STARTED_STATE;
        } else if(state === 'completed') {
            return COLORS.COMPLETED_STATE;
        }
        throw 'State ' + state + ' not handled.';
    };
    
    /**
     * Get a CSS Id String depending on the task complexity
     * @param taskComplexity - String
     * @return String
     */
    var getTaskComplexityClass = function(taskComplexity) {
        if(TASK_COMPLEXITY_VALUE.SMALL == taskComplexity){
            return TASK_COMPLEXITY_CLASS.SMALL;
        } else if(TASK_COMPLEXITY_VALUE.MEDIUM == taskComplexity){
            return TASK_COMPLEXITY_CLASS.MEDIUM;
        } else if(TASK_COMPLEXITY_VALUE.LARGE == taskComplexity) {
            return TASK_COMPLEXITY_CLASS.LARGE;
        }
        throw 'taskComplexity ' + taskComplexity + ' not handled.';
    }
    
    /**
     * Return the date number along with the ordinal suffix, such as 1st, 2nd, 3rd.
     */
    var getDateOrdinalSuffix = function(date){
        var suffix='th';
        if(date===1) suffix='st';
        if(date===2) suffix='nd';
        if(date===3) suffix='rd';
        return date+suffix;
    }
    
    /*********************
     * Boolean Functions *
     *********************/
    
    var isShowSmallTasksEnabled = function(){
        return $('#filterSmallCheckbox').is(':checked');
    }
    
    var isShowMediumTasksEnabled = function(){
        return $('#filterMediumCheckbox').is(':checked');
    }
    
    var isShowLargeTasksEnabled = function(){
        return $('#filterLargeCheckbox').is(':checked');
    }
    
    var isShowForThisWeekEnabled = function(){
        return $('#filterThisWeekCheckbox').is(':checked');
    }
    
    var isThisWeek = function(taskListItem){
        var firstDay = getFirstDayOfThisWeek();
        var lastDay = getLastDayOfThisWeek();
        var createdThisWeek = taskListItem.creation_date > firstDay && taskListItem.creation_date < lastDay;
        var startedThisWeek = taskListItem.start_date > firstDay && taskListItem.start_date < lastDay;
        var completedThisWeek = taskListItem.completion_date > firstDay && taskListItem.completion_date < lastDay;
        var dueThisWeek = taskListItem.due_date > firstDay && taskListItem.due_date < lastDay;
        return (createdThisWeek || startedThisWeek || completedThisWeek || dueThisWeek);
    }
    
    var isCategoryNameInUse = function(proposedCategoryName) {
        var alreadyInUse = false;   
        if( ALL_CATEGORIES_LABEL !== proposedCategoryName && UNASSIGNED_CATEGORIES_LABEL !== proposedCategoryName) {
            $.each(getCategories(), function( id, category ) {
                if(category.name === proposedCategoryName) {
                    alreadyInUse = true;
                    return false;//break
                }
            });
        }
        return alreadyInUse;
    }
    
    /********************
     * Setter Functions *
     ********************/
    
    /**
     * Updates the local storage taskList
     */
    var setTaskList = function(taskList){
        $('#undoButton').removeAttr('disabled');
        var newTaskListIndex = parseInt(localStorage.getItem('taskListIndex')) + 1;
        localStorage.setItem('taskList-'+newTaskListIndex, JSON.stringify(taskList));
        localStorage.setItem('taskListIndex',newTaskListIndex);
    }
    
    /**
     * Updates the local storage categories
     */
    var setCategories = function(categories){
        //$('#undoButton').removeAttr('disabled');
        localStorage.setItem('categories',JSON.stringify(categories));
    }
    
    /**
     * Updates the local storage taskListOrder
     */
    var setTaskListOrder = function(taskListOrder){
        $('#undoButton').removeAttr('disabled');
        var newTaskListOrderIndex = parseInt(localStorage.getItem('taskListOrderIndex')) + 1;
        localStorage.setItem('taskListOrder-'+newTaskListOrderIndex, JSON.stringify(taskListOrder));
        localStorage.setItem('taskListOrderIndex',newTaskListOrderIndex);
    }
    
    /**********************
     * HTTP GET Functions *
     **********************/
    
    /**
     * Gets the categories data from the server and stores it into local storage
     */
    var loadCategories = function(){
        console.log('loadCategories');
        
        $.post(GET_CATEGORIES_URL)
            .done( function(response) {
                if($.isEmptyObject(response)) {
                    console.log('no categories found');
                    setCategories({});
                } else {
                    console.log('found categories ' + response);
                    var jsonResponse = JSON.parse(response);
                    setCategories(jsonResponse);
                    //$('#undoButton').attr('disabled','disabled');
                }
                
                var totalTaskCount = Object.keys(getTaskList()).length;
                var unassignedTaskCount = 0;//TODO
                $('.category-list').empty();
                $('.category-list').append('<a class="unselectable list-group-item active"><span class="badge">'+totalTaskCount+'</span>'+ALL_CATEGORIES_LABEL+'</a>');
                $('.category-list').append('<a class="unselectable list-group-item"><span class="badge">'+unassignedTaskCount+'</span>'+UNASSIGNED_CATEGORIES_LABEL+'</a>');
                
                $.each(getCategories(), function( id, category ) {
                    var tasksForCategory = 0;//TODO
                    $('.category-list').append('<a class="unselectable list-group-item"><span class="badge">'+tasksForCategory+'</span>'+category.name+'</a>');
                });
                attachCategoryListButtons();
                
                loadCategorizedTasks();
    
                /* Set up the sortable lists */
                initializeSortableLists();
            })
            .fail( function(xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
            });
    }
    
    /**
     * Gets the task list data from the server and stores it into local storage
     */
    var loadData = function(){
        console.log('loadData');
        
        $.post(GET_TASK_LIST_URL)
            .done( function(response) {
                if($.isEmptyObject(response)) {
                    console.log('loadData no json received');
                    setTaskList({});
                } else {
                    console.log('loadData json received ');
                    var jsonResponse = JSON.parse(response);
                    setTaskList(jsonResponse.task_list);
                    setTaskListOrder(JSON.parse(jsonResponse.task_list_order));
                    $('#undoButton').attr('disabled','disabled');
                }
                loadCategories();
            })
            .fail( function(xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
            });
    }
    
    var loadCategorizedTasks = function(){
        $.post(GET_CATEGORIZED_TASKS_URL,
            function(response) {
                console.log('getCategorizedTasks response ' + response);
                if($.isEmptyObject(response)) {
                    console.log('no categorized tasks found');
                    localStorage.setItem('categorizedTasks','{}');
                    // TODO set unassigned task count
                } else {
                    localStorage.setItem('categorizedTasks',response);
                }
                updateCategoriesCount();
                populateTaskList();
            }
        );
    }
    
    /***********************
     * HTTP POST Functions *
     ***********************/
    
    /**
     * Makes an AJAX POST to save the categories
     */
    var addCategory = function(categoryName) {
        console.log('addCategory ' + categoryName);

        $.post(ADD_CATEGORY_URL,{category_name: categoryName} )
            .done( function(response) {
                console.log('addCategory response ' + response);
                var categories = getCategories();
                categories.push({name: categoryName});
                setCategories(categories);
            })
            .fail( function(xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
            });
    }
    
    /**
     * Makes an AJAX POST to delete a category
     */
    var deleteCategory = function(categoryName) {
        console.log('deleteCategory ' + categoryName);

        $.post(DELETE_CATEGORY_URL,{category_name: categoryName})
            .done( function(response) {
                console.log('deleteCategory response ' + response);
                // Remove the deleted category
                var categories = $.grep(getCategories(), function (category, index) {
                    if( categoryName === category.name ) {
                        return false;
                    }
                    return true; // keep the element in the array
                });
                setCategories(categories);
                loadCategorizedTasks();
                $('.category-list a.active').remove();
                $(".category-list a:contains("+ALL_CATEGORIES_LABEL+")").click();
            })
            .fail( function(xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
            });
    }
    
    /**
     * Makes an AJAX POST to rename a category
     */
    var renameCategory = function(oldCategoryName, newCategoryName) {
        console.log('renameCategory ' + oldCategoryName + ' to ' + newCategoryName);

        $.post(RENAME_CATEGORY_URL,
            {old_category_name:oldCategoryName, new_category_name:newCategoryName})
            .done( function(response) {
                console.log('renameCategory response ' + response);
                // update the categories local storage
                var categories = getCategories();
                $.each(categories, function( id, category ) {
                    if( oldCategoryName === category.name ) {
                        category.name = newCategoryName;
                        return false;//break
                    }
                });
                setCategories(categories);
                localStorage.setItem('selectedCategory',newCategoryName);
                loadCategorizedTasks();
            })
            .fail( function(xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
            });
    }
    
    /**
     * Makes an AJAX POST to add a category to a task
     */
    var addCategoryToTask = function(categoryName, taskId) {
        console.log('addCategoryToTask ' + categoryName + ', ' + taskId);

        $.post(ADD_CATEGORY_TO_TASK_URL,
            {category_name:categoryName, task_id:taskId})
            .done( function(response) {
                console.log('addCategoryToTask response ' + response);
                loadCategorizedTasks();
            })
            .fail( function(xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
            });
    }
    
    /**
     * Makes an AJAX POST to remove a category from a task
     */
    var removeCategoryFromTask = function(categoryName, taskId) {
        console.log('removeCategoryFromTask ' + categoryName + ', ' + taskId);

        $.post(REMOVE_CATEGORY_FROM_TASK_URL,
            {category_name:categoryName, task_id:taskId})
            .done( function(response) {
                console.log('removeCategoryFromTask response ' + response);
                loadCategorizedTasks();
            })
            .fail( function(xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
            });
    }
    
    /**
     *  If calling this without saveTaskListOrder(), make sure 
     *  to call setTaskListOrder(getTaskListOrder()) to ensure the undo indices are matching
     */
    var saveTaskList = function(taskList,callback) {
        setTaskList(taskList);
        updateCategoriesCount();
        saveTaskListToDatabase(taskList,callback);
    }
    
    /**
     * Makes an AJAX POST to save the task list
     */
    var saveTaskListToDatabase = function(taskList,callback) {
        console.log('saveTaskListToDatabase');

        $.post(SAVE_TASK_LIST_URL,
            {task_list:JSON.stringify(taskList)})
            .done( function(response) {
                console.log('saveTaskListToDatabase complete ' + response);
                if(callback !== undefined){
                    callback();
                }
            })
            .fail( function(xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
            });
    }
    
    /**
     *  If calling this without saveTaskList(), make sure 
     *  to call setTaskListOrder(getTaskList()) to ensure the undo indices are matching
     */
    var saveTaskListOrder = function() {
        var taskListOrder = getCurrentTaskListOrder();
        setTaskListOrder(taskListOrder);
        saveTaskListOrderToDatabase(taskListOrder);
    }
    
    /**
     * Makes an AJAX POST to save the task list order
     */
    var saveTaskListOrderToDatabase = function(taskListOrder) {
        console.log('saveTaskListOrderToDatabase');

        $.post(SAVE_TASK_LIST_ORDER_URL,
            {task_list_order:JSON.stringify(taskListOrder)})
            .done( function(response) {})
            .fail( function(xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
            });
    }
    
    var saveAll = function(taskList,callback) {
        saveTaskList(taskList,callback);
        saveTaskListOrder();
    }
    
    /**
     * Saves a new task, and retrieves a server-generated id
     */
    var addTaskItem = function(taskItem) {
        $.post(ADD_TASK_URL,{task: JSON.stringify(taskItem)} )
            .done( function(response) {
                var taskId = parseInt(response);
                if(!$.isNumeric(taskId)){
                    alert('Error occurred: ' + response);
                }
                console.log('addTaskItem id ' + taskId);
                
                taskItem.id = taskId;
                // do everything else here
                var taskList = getTaskList();
                taskList[taskId] = taskItem;
                setTaskList(taskList);
                addTaskToDisplay(taskItem);
                saveTaskListOrder();
                
                $('#addTaskTextField').val('');
                $('#addTaskButton').prop('disabled',true);
                
                // Add it to the selected category
                var selectedCategory = localStorage.getItem('selectedCategory');
                if(selectedCategory && selectedCategory != ALL_CATEGORIES_LABEL && selectedCategory != UNASSIGNED_CATEGORIES_LABEL){
                    addCategoryToTask(selectedCategory, taskItem.id);
                } else {
                    updateCategoriesCount();
                }
            })
            .fail( function(xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
            });
    }
    
    /********************************
     * Task List Building Functions *
     ********************************/
    
    /**
     *  Count the number of tasks in each category and update the display
     */
    var updateCategoriesCount = function(){
        // TODO some categories display a higher count than what's real
        console.log('updateCategoriesCount');
        var categoryCountMap = {};
        var tasksAssignedMap = {};
        // Go through each category with a task and add up the counts
        var categorizedTasks = JSON.parse(localStorage.getItem('categorizedTasks'));
        $.each(categorizedTasks, function( index, element ) {
            var count = 1;
            if(categoryCountMap[element.name] !== undefined){
                count = parseInt(categoryCountMap[element.name]) + 1;
            }
            categoryCountMap[element.name] = count;
            
            tasksAssignedMap[element.task_id] = true;
        });
        
        for (var key in categoryCountMap) {
            if (categoryCountMap.hasOwnProperty(key)) {
                $(".category-list a:contains("+key+") span").text(categoryCountMap[key]);
            }
        }
        
        // Set the total task count
        var totalTaskCount = Object.keys(getTaskList()).length;
        $(".category-list a:contains("+ALL_CATEGORIES_LABEL+") span").text(totalTaskCount);
        
        // Set unassigned task count
        $(".category-list a:contains("+UNASSIGNED_CATEGORIES_LABEL+") span").text(totalTaskCount-Object.keys(tasksAssignedMap).length);
        
        // zero out categories without a task       
        $.each(getCategories(), function( id, category ) {
            var i;
            for (i = 0; i < categorizedTasks.length; ++i) {
                // Don't add already selected categories from the list
                if(categorizedTasks[i].name === category.name) {
                    return true; // continue to next category
                }
            }
            $(".category-list a:contains("+category.name+") span").text(0);
        });
        
    }
     
    /**
     * Takes an HTML li element and shows/hides child elements based on state
     * @param html - HTML element
     * @param state - String
     * @return HTML element
     */
    var updateTaskDisplayBasedOnState = function(html, state){
        
        var taskButtonBarDiv = html.find('.taskButtonBar');
        if(state === 'new'){
            taskButtonBarDiv.find('.start-button').show();
            taskButtonBarDiv.find('.stop-button').hide();
            taskButtonBarDiv.find('.complete-button').hide();
            taskButtonBarDiv.find('.completion-date').hide();
            taskButtonBarDiv.find('.due-date').show();
        } else if(state === 'started'){
            taskButtonBarDiv.find('.start-button').hide();
            taskButtonBarDiv.find('.stop-button').show();
            taskButtonBarDiv.find('.complete-button').show();
            taskButtonBarDiv.find('.completion-date').hide();
            taskButtonBarDiv.find('.due-date').show();
        } else if(state === 'completed') {
            taskButtonBarDiv.find('.start-button').hide();
            taskButtonBarDiv.find('.stop-button').hide();
            taskButtonBarDiv.find('.complete-button').hide();
            taskButtonBarDiv.find('.due-date').hide();
            taskButtonBarDiv.find('.completion-date').show();
        }
        return html;
    }
    
    /**
     * Creates an HTML element from a TaskListItem
     * @param taskListItem - TaskListItem
     * @return HTML element
     */
    var generateElement = function(taskListItem){
        var due_dateString = "Due date not set";
        if(taskListItem.due_date) {
            due_dateString = 'Due ' + moment(formatDate(taskListItem.due_date), 'dddd MMMM Do, YYYY H:mm').fromNow();
        }
        return $("<li id=" + taskListItem.id + " data-role='list-divider' style='background-color: " + getColorOfState(taskListItem.state) + "' class='taskContainer'><div class='taskButtonBar'><span class='remove-button'></span><span class='complete-button'></span><span class='start-button'></span><span class='stop-button'></span><span class='completion-date'>"+formatDate(taskListItem.completion_date)+"</span><a class='due-date'>"+due_dateString+"</a></div><div class='taskLabelContainer' style='white-space:nowrap'><span class='"+getTaskComplexityClass(taskListItem.complexity) + "'></span><div id='label-"+ taskListItem.id +"' class='taskLabel'>" + taskListItem.task_name + "</div></div></li>");
    };

    var addDateSelectionHandler = function(due_dateElement,taskListItemId) {
        due_dateElement.on('changeDate', function(ev){
            var gmtTimestamp = ev.date.valueOf();
            var localTimestamp = gmtTimestamp + (new Date(gmtTimestamp).getTimezoneOffset() * 60000);//Converting minutes to millis
            //due_dateElement.text('Due ' + formatDate(localTimestamp));
            due_dateElement.text('Due ' + moment(formatDate(localTimestamp), 'dddd MMMM Do, YYYY H:mm').fromNow());

            var taskList = getTaskList();
            taskList[taskListItemId].due_date = localTimestamp;
            saveTaskList(taskList);
            setTaskListOrder(getTaskListOrder());//This is to keep the undo indexes in order
        });
    }
    
    /**
     * Adds a TaskListItem to the current page
     * @param taskListItem - TaskListItem
     */
    var addTaskToDisplay = function(taskListItem){
        var elem = generateElement(taskListItem);
        
        //Filters
        if(!isShowSmallTasksEnabled() && TASK_COMPLEXITY_VALUE.SMALL === taskListItem.complexity){
            elem.hide();
        } else if(!isShowMediumTasksEnabled() && TASK_COMPLEXITY_VALUE.MEDIUM === taskListItem.complexity){
            elem.hide();
        } else if(!isShowLargeTasksEnabled() && TASK_COMPLEXITY_VALUE.LARGE === taskListItem.complexity){
            elem.hide();
        } else if(isShowForThisWeekEnabled() && !isThisWeek(taskListItem)){
            elem.hide();
        }
        
        //Category Filter
        var selectedCategory = localStorage.getItem('selectedCategory');
        if(selectedCategory && selectedCategory != ALL_CATEGORIES_LABEL){
            var selectedCategories = JSON.parse(localStorage.getItem('categorizedTasks'));
            var inSelectedCategory = false;
            var isAssignedACategory = false;
            $.each(selectedCategories, function( id, category ) {
                if(category.task_id == taskListItem.id){
                    isAssignedACategory = true;
                    if(selectedCategory == category.name) {
                        inSelectedCategory = true;
                        return false; // break
                    }
                }
            });
            
            if(selectedCategory === UNASSIGNED_CATEGORIES_LABEL){
                if(isAssignedACategory) {
                    elem.hide();
                }
            } else if(!inSelectedCategory){
                elem.hide();
            }
        }
        
        var listName = TASK_LIST_ID;
        if(taskListItem.state === 'completed') {
            listName = COMPLETED_TASK_LIST_ID;
            //display the completed task header
            $('#completedTasksHeader').show();
        } else if(!(elem.css('display') == 'none')){
            // Attach datetime widget to the due date label only on click, to reduce the massive amount of new divs added
            var due_dateElement = elem.find('.due-date');
            due_dateElement.click( function() {
                if(!due_dateElement.hasClass('datePickerRegistered')){
                    due_dateElement.addClass('datePickerRegistered');
                    due_dateElement.datetimepicker({format: 'M d yyyy h:ii', bootcssVer:3, autoclose:true});
                    addDateSelectionHandler(due_dateElement,taskListItem.id);
                    due_dateElement.datetimepicker('show');
                }
            });
            
        }
        
        $(listName).append(updateTaskDisplayBasedOnState(elem, taskListItem.state));
    }
    
    /**
     * Formats a timestamp into a readable date string, Tuesday May 5th
     * @param timestamp the number of milliseconds from midnight of January 1, 1970
     * @return String
     */
    var formatDate = function(timestamp){
        if(!timestamp){
            return '';
        } else {
            var unformattedDate = new Date(timestamp);
            var day = unformattedDate.getDay();
            var month = unformattedDate.getMonth();
            var date = unformattedDate.getDate();
            var year = unformattedDate.getFullYear();
            var hour = unformattedDate.getHours();
            var minute = unformattedDate.getMinutes();
            var formattedDate = DAY_OF_WEEK_NAMES[day] + ' ' + MONTH_NAMES[month] + ' ' + getDateOrdinalSuffix(date) + ', ' + year +' '+ hour + ':' + minute;
            return formattedDate;
        }
    }
    
    /**
     * Focuses and sets the caret at the end of the element
     */
    var setCaretAtEnd = function(element){
        element.focus();
        // If this function exists...
        if (element.setSelectionRange) {
          // ... then use it (Doesn't work in IE)
          // Double the length because Opera is inconsistent about whether a carriage return is one character or two. Sigh.
          var len = element.val().length * 2;
          element.setSelectionRange(len, len);
        } else {
        // ... otherwise replace the contents with itself
        // (Doesn't work in Google Chrome)
          element.val(element.val());
        }
    }
    
    /**
     * Adds a click listener to each item in the category list
     */
    var attachCategoryListButtons = function(){
        $('.category-list a').unbind( "click" );
        $('.category-list a').click(function(e) {
            $('.category-list a.active').removeClass('active');
            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                var categoryName = $(this).get(0).lastChild.nodeValue;
                console.log('selected category ' + categoryName);
                localStorage.setItem('selectedCategory',categoryName);
                if(ALL_CATEGORIES_LABEL===categoryName || UNASSIGNED_CATEGORIES_LABEL===categoryName){
                    $('#renameCategoryButton').attr('disabled','disabled');
                    $('#deleteCategoryButton').attr('disabled','disabled');
                } else {
                    $('#renameCategoryButton').removeAttr('disabled');
                    $('#deleteCategoryButton').removeAttr('disabled');
                }
                populateTaskList();
            }
            e.preventDefault();
        });
    }
    
    var updateStatistics = function() {
        var taskList = getTaskList();
        var newTaskCount = 0;
        var startedTaskCount = 0;
        var completedTaskCount = 0;
        if(taskList){
            // Check against filters
            $.each(taskList, function( id, task ) {
                var passedFilter = false;
                if(isShowSmallTasksEnabled() && TASK_COMPLEXITY_VALUE.SMALL === task.complexity){
                    passedFilter = true;
                } else if(isShowMediumTasksEnabled() && TASK_COMPLEXITY_VALUE.MEDIUM === task.complexity){
                    passedFilter = true;
                } else if(isShowLargeTasksEnabled() && TASK_COMPLEXITY_VALUE.LARGE === task.complexity){
                    passedFilter = true;
                } else if(isShowForThisWeekEnabled() && isThisWeek(task)){
                    passedFilter = true;
                }
                
                // TODO Update statistics when filtered by categories
                
                if(passedFilter) {
                    switch(task.state) {
                        case 'new':
                            newTaskCount++;
                            break;
                        case 'started':
                            startedTaskCount++;
                            break;
                        case 'completed':
                            completedTaskCount++;
                            break;
                    }
                }
            });
        }
        $('#statsNewTaskCount').text(newTaskCount);
        $('#statsStartedTaskCount').text(startedTaskCount);
        $('#statsCompletedTaskCount').text(completedTaskCount);
        $('#statsTotalTaskCount').text(newTaskCount+startedTaskCount+completedTaskCount);
    }
    
    /**
     * Initialize the jQuery UI sortable lists.  Allow drag and drop onto categories.
     */
    var initializeSortableLists = function() {
        $( TASK_LIST_ID +',' + COMPLETED_TASK_LIST_ID ).sortable({
            cancel : 'span',
            containment: 'body',
            update: function(event, ui) {
                setTaskList(getTaskList());//This is to keep the undo indexes in order
                saveTaskListOrder();
            },
            start: function( event, ui ) {

                // Use coordinates to track if the dragged item goes over a category
                var mousex, mousey, coordinates = [];
                
                $(".category-list a").each(function() {
                    var categoryName = $(this).get(0).lastChild.nodeValue;
                    if(ALL_CATEGORIES_LABEL !== categoryName && UNASSIGNED_CATEGORIES_LABEL !== categoryName){
                        var lefttop = $(this).offset();
                        // and save them in a container for later access
                        coordinates.push({
                            dom: $(this),
                            left: lefttop.left,
                            top: lefttop.top,
                            right: lefttop.left + $(this).outerWidth(),
                            bottom: lefttop.top + $(this).outerHeight()
                        });
                    }
                });

                var continueDragging = function(e) {

                    // Check if we hit any boxes
                    for (var i in coordinates) {
                        if (mousex >= coordinates[i].left && mousex <= coordinates[i].right) {
                            if (mousey >= coordinates[i].top && mousey <= coordinates[i].bottom) {
                                // Yes, the mouse is on a droppable area
                                // Lets change the background color
                                coordinates[i].dom.addClass("highlighted-category");
                                continue;
                            }
                        }
                            // Nope, we did not hit any objects yet
                        coordinates[i].dom.removeClass("highlighted-category");
                    }

                    // Keep the last positions of the mouse coord.s
                    mousex = e.pageX;
                    mousey = e.pageY;
                }
                
                $(document).bind("mousemove", continueDragging);
            },
            stop: function( event, ui ) {
                $(document).unbind("mousemove");
                
                if($('.category-list a.highlighted-category').length){
                    // A category was selected
                    var categoryName = $('.category-list a.highlighted-category').get(0).lastChild.nodeValue;
                    var taskId = ui.item.attr('id');
                    addCategoryToTask(categoryName, taskId);
                    $('.category-list a').removeClass('highlighted-category');
                }
            }
        });
    }
    
    /**
     * Clear all local storage items relating to this app
     */
    var clearLocalStorage = function() {
        localStorage.removeItem('categories');
        localStorage.removeItem('selectedCategory');
        localStorage.removeItem('categorizedTasks');

        localStorage.removeItem('taskList');
        localStorage.removeItem('taskListIndex');
        localStorage.removeItem('taskListOrder');
        localStorage.removeItem('taskListOrderIndex');
        
        Object.keys(localStorage).forEach(function(key){
           if (/^(taskList-)|(taskListOrder-)/.test(key)) {
               localStorage.removeItem(key);
           }
        });
    }
    
    /**
     * Creates and downloads a file with content
     */
    var downloadFile = function(filename, textContent) {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent));
        pom.setAttribute('download', filename);
        pom.click();
    }
    
    /* Populate the task list from local storage */
    var populateTaskList = function() {
        //console.log('populateTaskList start');
        var taskList = getTaskList();
        taskList = taskList || {};
        //Clear existing lists
        $(TASK_LIST_ID).empty();
        $(COMPLETED_TASK_LIST_ID).empty();
        $('#completedTasksHeader').hide();
        var tempTaskListOrder = getTaskListOrder();
        if ( tempTaskListOrder){
            for (i = 0; i < tempTaskListOrder.length; ++i) {
                var taskListItem = taskList[tempTaskListOrder[i]];
                if(!taskListItem) {
                    console.log("Could not find task item for id " + tempTaskListOrder[i]);
                } else {
                    addTaskToDisplay(taskList[tempTaskListOrder[i]]);
                }
            }
        }
        
        // Setup on hover styles
        $('[id^=sortable] li').mouseenter( function () {
            $(this).addClass('selected-task') ;
        });
        $('[id^=sortable] li').mouseleave( function () {
            // Remove the hover style if there aren't any context menus open
            if(!$('#context-menu-layer').length) {
                $(this).removeClass('selected-task');
                // if the context menu closes, then remove the style
                $(document.body).on("contextmenu:hide", 
                    function(e){ $('[id^=sortable] li.selected-task').removeClass('selected-task'); });
            }
        });
        
        updateStatistics();
    }
    // End of function declaration
    /********************
     *  Initialization  *
     ********************/
    
    console.log('Initialization');
    clearLocalStorage();
    localStorage.setItem('taskListIndex',-1);
    localStorage.setItem('taskListOrderIndex',-1);
    loadData();
    
    /********************
     * DOM Manipulation *
     ********************/
    
    /* Hook up the buttons inside each task */
    $('[id^=sortable]').on('click','li div span', function () {
        var parentContainer = $(this).parent().parent();
        var taskId = parentContainer.attr('id');
        var buttonClicked = $(this).attr('class');
        var taskList = getTaskList();
        console.log('button clicked ' + buttonClicked);
        if('complete-button' == buttonClicked){
            taskList[taskId].state = 'completed';
            taskList[taskId].completion_date = new Date().getTime();

            //Remove the task from the top list and add to the completed list
            parentContainer.remove();
            addTaskToDisplay(taskList[taskId]);
            //Scroll to the bottom
            //$('html, body').animate({ scrollTop: $(document).height() }, 'slow');
        } else if('start-button' == buttonClicked){
            parentContainer.css({'background-color': COLORS.STARTED_STATE}); 
            taskList[taskId].state = 'started';
            taskList[taskId].start_date = new Date().getTime();
            //Get span and update start_date
            //$(this).parent().children('.start-date').text('Started '+formatDate(taskList[taskId].start_date));
            updateTaskDisplayBasedOnState(parentContainer,taskList[taskId].state);
        } else if('stop-button' == buttonClicked){
            parentContainer.css({'background-color': COLORS.NEW_STATE});
            taskList[taskId].state = 'new';
            updateTaskDisplayBasedOnState(parentContainer,taskList[taskId].state);
        } else if('remove-button' == buttonClicked){
            parentContainer.remove();
            delete taskList[taskId];
            // load categorizedTasks after save
            saveAll(taskList, function() { loadCategorizedTasks(); });
            return;
        } else {
            return;
        }
        saveAll(taskList);
    });
    
    /* Hook up the task label to toggle showing of overflow text */
    $('[id^=sortable]').on('click','.taskLabelContainer', function () {
        if($(this).css('white-space') == 'nowrap'){
            $(this).css('white-space','normal');
        } else {
            $(this).css('white-space','nowrap');
        }
    });

    /* Hook up the Add task button */
    $('#addTaskButton').click(function (e) {
        e.preventDefault();
        
        var id = new Date().getTime();
        var creation_date = new Date().getTime();
        var task_name = $("input[id='addTaskTextField']").val();
        var complexity = $('#complexityComboBox :selected').text();
        var tempTaskItem = {
            id : id,
            task_name: task_name,
            complexity: complexity,
            creation_date: creation_date,
            due_date: '',
            start_date: '',
            completion_date: '',
            state: 'new',
        };
        
        addTaskItem(tempTaskItem);
    });
    
    /* Hook up the Save button */
    $('#saveButton').click(function (e) {
        e.preventDefault();
        saveAll(getTaskList(), true);
    });
    
    /* Hook up the Export button */
    $('#exportButton').click(function (e) {
        var exportObject = {};
        $.each(localStorage, function(key, value){
            exportObject[key] = value;
        });
        var dateString = $.datepicker.formatDate('yy-mm-dd', new Date());
        downloadFile('task-list-'+dateString+'.txt', JSON.stringify(exportObject));
    });
    
    /* Listen for a file selection from the Import button */
    $(document).on('change', '.btn-file :file', function() {
    
        var input = $('#importFileInput').get(0);
        if (!input) {
            alert("Um, couldn't find the fileinput element.");
        }
        else if (!input.files) {
            alert("This browser doesn't seem to support the `files` property of file inputs.");
        }
        else if (!input.files[0]) {
            alert("Please select a file before clicking 'Load'");               
        }
        else {
            var fileReader = new FileReader();
            fileReader.onload = function handleFileImport() {
            $(".btn-file :file").val(""); //Clear the selection text, so another upload of the same file can occur
                try {
                    var importedObject = JSON.parse(fileReader.result);
                    var taskListNumber = -1;
                    
                    var taskListName = 'taskList-' + importedObject.taskListIndex;
                    var taskListOrderName = 'taskListOrder-' + importedObject.taskListOrderIndex;
                    
                    $.each(JSON.parse(importedObject[taskListOrderName]), function( index, element ) {
                        var taskList = JSON.parse(importedObject[taskListName]);
                        addTaskItem(taskList[element]);
                    });
                } catch(err) {
                    alert('File contents not supported.');
                    return;
                }
            }   
            fileReader.readAsText(input.files[0]);
            //fileReader.readAsDataURL(file);
        }
    });
    
    /* Hook up the Clear All button */
    $('#clearAllButton').click(function (e) {
        e.preventDefault();
        saveAll({});
        populateTaskList();
    });
    
    /* Hook up the Undo button */
    $('#undoButton').click(function (e) {
        e.preventDefault();
        var previousTaskListIndex = parseInt(localStorage.getItem('taskListIndex')) - 1;
        var previousTaskListOrderIndex = parseInt(localStorage.getItem('taskListOrderIndex')) - 1;
        //console.log('undo previousTaskListIndex:' + previousTaskListIndex + ', previousTaskListOrderIndex:'+previousTaskListOrderIndex);
        if((previousTaskListIndex >=0) && (previousTaskListOrderIndex >=0)) {
            localStorage.setItem('taskListIndex',previousTaskListIndex);
            localStorage.setItem('taskListOrderIndex',previousTaskListOrderIndex);
            populateTaskList();

            saveTaskListToDatabase(getTaskList());
            saveTaskListOrderToDatabase(getTaskListOrder());

            $('#redoButton').removeAttr('disabled');
            if((previousTaskListIndex == 0) || (previousTaskListOrderIndex ==0)){
                $('#undoButton').attr('disabled','disabled');
            }
        }
    });
    
    /* Hook up the Redo button */
    $('#redoButton').click(function (e) {
        e.preventDefault();
        var nextTaskListIndex = parseInt(localStorage.getItem('taskListIndex')) + 1;
        var nextTaskListOrderIndex = parseInt(localStorage.getItem('taskListOrderIndex')) + 1;
        //console.log('redo nextTaskListIndex:' + nextTaskListIndex + ', nextTaskListOrderIndex:'+nextTaskListOrderIndex);
        if((nextTaskListIndex >=0) && (nextTaskListOrderIndex >=0) && localStorage.getItem('taskList-'+nextTaskListIndex) && localStorage.getItem('taskListOrder-'+nextTaskListOrderIndex)) {
            localStorage.setItem('taskListIndex',nextTaskListIndex);
            localStorage.setItem('taskListOrderIndex',nextTaskListOrderIndex);
            populateTaskList();

            saveTaskListToDatabase(getTaskList());
            saveTaskListOrderToDatabase(getTaskListOrder());

            $('#undoButton').removeAttr('disabled');
            //Check if the next indices exist. If not, disable redo button
            if(!(localStorage.getItem('taskList-'+(nextTaskListIndex+1)) && localStorage.getItem('taskListOrder-'+(nextTaskListOrderIndex+1)))){
                $('#redoButton').attr('disabled','disabled');
            }
        }
    });
    
    var getAddCategoriesForContextMenuString = function(taskId){
        var selectedCategories = JSON.parse(localStorage.getItem('categorizedTasks'));
        var categoriesObj = {};
        
        $.each(getCategories(), function( id, category ) {
            var i;
            for (i = 0; i < selectedCategories.length; ++i) {
                // Don't add already selected categories from the list
                if(selectedCategories[i].task_id == taskId && selectedCategories[i].name === category.name) {
                    return true; // continue to next category
                }
            }
            categoriesObj[ADD_CATEGORY_PREFIX+category.name] = {name: category.name};
        });
        return categoriesObj;
    }
    
    var generateDeleteCategoryContextMenu = function(taskId) {
        var selectedCategories = JSON.parse(localStorage.getItem('categorizedTasks'));
        var categoriesObj = {};
        $.each(selectedCategories, function( id, category ) {
            if(category.task_id == taskId) {
                categoriesObj[DELETE_CATEGORY_PREFIX+category.name] = {name: category.name};
            }
        });
        if( $.isEmptyObject(categoriesObj)) {
            return '';
        } else {
            return {'delete-category':{name:'Remove', items: categoriesObj}};
        }
    }
    
    var generateAddRemoveCategoriesContextMenu = function(taskId) {
        var deleteContextMenu = generateDeleteCategoryContextMenu(taskId);
        var addContextMenu = {'add-category':{name:'Include', items: getAddCategoriesForContextMenuString(taskId)}};
        return $.extend(addContextMenu,deleteContextMenu);
    }
    
    /**
      * Connect the context menu to selectable rows
      * The names of each context item are keys for the listener to distinguish
      */ 
    $.contextMenu({
        selector: '.taskContainer', 
        callback: function(key, options) {
            console.log('key: '+key);
            
            if(key.match('^'+ADD_CATEGORY_PREFIX)){
                var taskId = $(this).attr('id');
                var categoryName = key.replace(ADD_CATEGORY_PREFIX,'');
                addCategoryToTask(categoryName, taskId);
            } else if(key.match('^'+DELETE_CATEGORY_PREFIX)){
                console.log('delete category to task');
                var taskId = $(this).attr('id');
                var categoryName = key.replace(DELETE_CATEGORY_PREFIX,'');
                removeCategoryFromTask(categoryName, taskId);
            }
            
            // TODO prefix each key to be app unique to avoid collisions with categories
            else if('edit-name'===key){
                $(TASK_LIST_ID +',' + COMPLETED_TASK_LIST_ID).sortable('destroy');
                // Change the label into an input field
                var taskLabel = $(this).find('.taskLabel');
                var originalText = taskLabel.text();
                taskLabel.text('');
                taskLabel.append("<div id='removableDiv'><input id='editTaskLabel' class='sortable-input' value='"+originalText+"'></input></div>");
                var inputField = taskLabel.find('.sortable-input');
                setCaretAtEnd(inputField);
                
                //change the input field back to a label
                var replaceInputAndSave = function(){
                    var inputFieldText = inputField.val();
                    taskLabel.find('.removableDiv').remove();
                    taskLabel.text(inputFieldText);
                    if(originalText!=inputFieldText){
                        var taskList = getTaskList();
                        taskList[taskLabel.parent().parent().attr('id')].task_name = inputFieldText;
                        saveTaskList(taskList);
                        setTaskListOrder(getTaskListOrder());//This is to keep the undo indexes in order
                    }
                }
                //On focus lost
                inputField.blur(function() {
                  replaceInputAndSave();
                  initializeSortableLists();
                });
                
                inputField.keypress(function(e) {
                    if(e.which == 13) {
                        //On Enter key pressed
                        replaceInputAndSave();
                        initializeSortableLists();
                    }
                });
                inputField.keydown(function(e) {
                    if(e.which == 27) {
                        //On Escape, restore text
                        taskLabel.find('.removableDiv').remove();
                        taskLabel.text(originalText);
                        initializeSortableLists();
                    }
                });
            } else if('change-to-small-task'==key){
                //switch out icon
                var span = $(this).find('.taskLabelContainer span');
                var newClass = TASK_COMPLEXITY_CLASS.SMALL;
                if(newClass != span.attr('class')){
                    span.removeClass();
                    span.addClass(newClass);
                    //save new state
                    var taskList = getTaskList();
                    taskList[span.parent().parent().attr('id')].complexity = TASK_COMPLEXITY_VALUE.SMALL;
                    saveTaskList(taskList);
                    setTaskListOrder(getTaskListOrder());//This is to keep the undo indexes in order
                }
            } else if('change-to-medium-task'==key){
                //switch out icon
                var span = $(this).find('.taskLabelContainer span');
                var newClass = TASK_COMPLEXITY_CLASS.MEDIUM;
                if(newClass != span.attr('class')){
                    span.removeClass();
                    span.addClass(newClass);
                    //save new state
                    var taskList = getTaskList();
                    taskList[span.parent().parent().attr('id')].complexity = TASK_COMPLEXITY_VALUE.MEDIUM;
                    saveTaskList(taskList);
                    setTaskListOrder(getTaskListOrder());//This is to keep the undo indexes in order
                }
            } else if('change-to-large-task'==key){
                //switch out icon
                var span = $(this).find('.taskLabelContainer span');
                var newClass = TASK_COMPLEXITY_CLASS.LARGE;
                if(newClass != span.attr('class')){
                    span.removeClass();
                    span.addClass(newClass);
                    //save new state
                    var taskList = getTaskList();
                    taskList[span.parent().parent().attr('id')].complexity = TASK_COMPLEXITY_VALUE.LARGE;
                    saveTaskList(taskList);
                    setTaskListOrder(getTaskListOrder());//This is to keep the undo indexes in order
                }
            }
        },
        //build a dynamic context menu
        build: function(element, event) {
            var taskId = element.attr('id');
            return {
                items: {
                    "edit-name": {name: "Edit Name", icon: "edit"},
                    "edit-complexity": {
                        name: "Complexity",
                        icon: "smalltask",
                        items: {
                            'change-to-small-task':{name: "Small", icon: "smalltask"},
                            'change-to-medium-task':{name: "Medium", icon: "mediumtask"},
                            'change-to-large-task':{name: "Large", icon: "largetask"}
                        }
                    },
                    "edit-categories": {
                        name: 'Categories',
                        items: generateAddRemoveCategoriesContextMenu(taskId)
                    }
                }
            };
        }
    });
    
    /* Hook up the Show Small Tasks button */
    $("#filterSmallCheckbox").change(function() {
        populateTaskList();
    });
    /* Hook up the Show Medium Tasks button */
    $("#filterMediumCheckbox").change(function() {
        populateTaskList();
    });
    /* Hook up the Show Large Tasks button */
    $("#filterLargeCheckbox").change(function() {
        populateTaskList();
    });
    /* Hook up the Show For This Week button */
    $("#filterThisWeekCheckbox").change(function() {
        populateTaskList();
    });
    
    /* Enable add new task button when a task name is entered */
    $('#addTaskTextField').on('input', function() {
        if(!$.trim(this.value).length) { // empty string
            $('#addTaskButton').prop('disabled',true);
        } else {
            $('#addTaskButton').prop('disabled',false);
        }
    });
    
    /* Enable add new category button when a category name is entered */
    $('#newCategoryTextField').on('input', function() {
        var categoryName = $.trim(this.value);
        if(!categoryName.length || isCategoryNameInUse(categoryName)) {
            $('#addNewCategoryButton').prop('disabled',true);
        } else {
            $('#addNewCategoryButton').prop('disabled',false);
        }
    });
    
    /* Hook up the Add Category button */
    $('#addNewCategoryButton').click(function (e) {
        e.preventDefault();
        var categoryName = $('#newCategoryTextField').val();
        
        $('.category-list').append('<a class="unselectable list-group-item"><span class="badge">0</span>'+ categoryName +'</a>');
        attachCategoryListButtons();
        
        $('#newCategoryTextField').val('');
        $(this).prop('disabled',true);
        addCategory(categoryName);
    });
    
    /* Hook up the Delete Category button */
    $('#deleteCategoryButton').click(function (e) {
        var categoryText = $('.category-list a.active').get(0).lastChild.nodeValue;
        console.log('deleting ' + categoryText);
        deleteCategory(categoryText);
        e.preventDefault();
    });
    
    /* Hook up the Rename Category button */
    $('#renameCategoryButton').click(function (e) {
        var selectedCategory = $('.category-list a.active');
        var categoryText = $('.category-list a.active').get(0).lastChild.nodeValue;
        selectedCategory.get(0).lastChild.nodeValue = '';
        selectedCategory.append("<div id='removableDiv'><input id='editTaskLabel' class='category-input form-control' value='"+categoryText+"'></input></div>");
        var inputField = selectedCategory.find('.category-input');
        setCaretAtEnd(inputField);
        e.preventDefault();
        
        //On focus lost
        inputField.blur(function() {
            var inputFieldText = inputField.val();
            selectedCategory.find('.removableDiv').remove();
            if(isCategoryNameInUse(inputFieldText)){
                selectedCategory.get(0).lastChild.nodeValue = categoryText;
            } else {
                selectedCategory.get(0).lastChild.nodeValue = inputFieldText;
                renameCategory(categoryText, inputFieldText);
            }
        });
        
        inputField.keypress(function(e) {
            if(e.which == 13) {
                //On Enter key pressed
                var inputFieldText = inputField.val();
                selectedCategory.find('.removableDiv').remove();
                if(isCategoryNameInUse(inputFieldText)){
                    selectedCategory.get(0).lastChild.nodeValue = categoryText;
                } else {
                    selectedCategory.get(0).lastChild.nodeValue = inputFieldText;
                    renameCategory(categoryText, inputFieldText);
                }
            }
        });
        inputField.keydown(function(e) {
            if(e.which == 27) {
                //On Escape, restore text
                selectedCategory.find('.removableDiv').remove();
                selectedCategory.text(categoryText);
            }
        });
    });
});
