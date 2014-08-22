$(document).ready(function() {

	// Keep the addTaskTextField scaled dependening on the window width
    function checkWidth() {
		$('#addTaskTextField').width($('#taskListContainer').width() - 210);
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
	 
	var colors = {
		newstate: 'rgba(255,255,255,'+listItemTransparency+')',
		startedstate: 'rgba(255,255,170,'+listItemTransparency+')',
		completedstate: 'rgba(212,255,170,'+listItemTransparency+')',
	};
	
	var taskIds = {
		small: 'small-task',
		medium: 'medium-task',
		large: 'large-task',
	};
	
	var dayOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

	var inProgressListName = '#sortableTodo';
	var completedListName = '#sortableCompleted';
	
	var getTaskListUrl = "http://YOUR-HOST/task-list/get-task-list.php";
	var saveTaskListUrl = "http://YOUR-HOST/task-list/save-task-list.php";
	var saveTaskListOrderUrl = "http://YOUR-HOST/task-list/save-task-list-order.php";
	
	/********************
	 *     Functions    *
	 ********************/
	//console.logCopy = console.log.bind(console);
	//console.log = function(data)
	//{
	//	var timestamp = '[' + Date.now() + '] ';
	//	this.logCopy(timestamp, data);
	//};
	
	var isAutosaveEnabled = function(){
		return $('#autosaveCheckbox').is(':checked');
	}
	
	/**
	 * Only allow saving if there is a change
	 */
	var setDirty = function(isDirty){
		if(isDirty){
			$('#saveButton').removeAttr('disabled');
		} else {
			$('#saveButton').attr('disabled','disabled');
		}
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
		var taskListOrder = $(inProgressListName).sortable('toArray');
		var completedListOrder = $(completedListName).sortable('toArray');
		var combinedOrder = $.merge( taskListOrder , completedListOrder );
		return combinedOrder;
	}
	
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
	 * Updates the local storage taskListOrder
	 */
	var setTaskListOrder = function(taskListOrder){
		$('#undoButton').removeAttr('disabled');
		var newTaskListOrderIndex = parseInt(localStorage.getItem('taskListOrderIndex')) + 1;
		localStorage.setItem('taskListOrder-'+newTaskListOrderIndex, JSON.stringify(taskListOrder));
		localStorage.setItem('taskListOrderIndex',newTaskListOrderIndex);
	}
	
	/**
	 *  If calling this without saveTaskListOrder(), make sure 
	 *  to call setTaskListOrder(getTaskListOrder()) to ensure the undo indices are matching
	 */
	var saveTaskList = function(taskList,saveToServer) {
		if(saveToServer) {
			saveTaskListToDatabase(taskList);
		}
		setTaskList(taskList);
	}
	
	/**
	 * Makes an AJAX POST to save the task list
	 */
	var saveTaskListToDatabase = function(taskList) {
		console.log('saveTaskListToDatabase');

		// fire off the request
		request = $.ajax({
			url: saveTaskListUrl,
			type: "post",
			data: JSON.stringify(taskList),
			contentType: "application/json"
		});
		
		// callback handler that will be called on success
		request.done(function (response, textStatus, jqXHR){
			console.log('saveTaskListToDatabase complete ' + textStatus);
			setDirty(false);
		});

		// callback handler that will be called on failure
		request.fail(function (jqXHR, textStatus, errorThrown){
			// log the error to the console
			console.error(
				"The following error occured: "+
				textStatus, errorThrown
			);
		});
	}
	
	/**
	 *  If calling this without saveTaskList(), make sure 
	 *  to call setTaskListOrder(getTaskList()) to ensure the undo indices are matching
	 */
	var saveTaskListOrder = function(saveToServer) {
		var taskListOrder = getCurrentTaskListOrder();
		if(saveToServer) {
			saveTaskListOrderToDatabase(taskListOrder);
		}
		setTaskListOrder(taskListOrder);
	}
	
	/**
	 * Makes an AJAX POST to save the task list order
	 */
	var saveTaskListOrderToDatabase = function(taskListOrder) {
		console.log('saveTaskListOrderToDatabase');

		// fire off the request
		request = $.ajax({
			url: saveTaskListOrderUrl,
			type: "post",
			data: JSON.stringify(taskListOrder),
			contentType: "application/json"
		});
		
		// callback handler that will be called on success
		request.done(function (response, textStatus, jqXHR){
			console.log('saveTaskListOrderToDatabase ' + textStatus);
			setDirty(false);
		});

		// callback handler that will be called on failure
		request.fail(function (jqXHR, textStatus, errorThrown){
			// log the error to the console
			console.error(
				"The following error occured: "+
				textStatus, errorThrown
			);
		});
	}
	
	var saveAll = function(taskList,saveToServer) {
		saveTaskList(taskList,saveToServer);
		saveTaskListOrder(saveToServer);
	}
	
	/**
	 * Get a color String depending on the task state
	 * @param state - String
	 * @return String
	 */
	var getColorOfState = function(state) {
		if(state === 'new'){
			return colors.newstate;
		} else if(state === 'started'){
			return colors.startedstate;
		} else if(state === 'completed') {
			return colors.completedstate;
		}
		throw 'State ' + state + ' not handled.';
	};
	
	/**
	 * Get a CSS Id String depending on the task complexity
	 * @param taskComplexity - String
	 * @return String
	 */
	var getTaskId = function(taskComplexity) {
		if(taskComplexity == 'S'){
			return taskIds.small;
		} else if(taskComplexity == 'M'){
			return taskIds.medium;
		} else if(taskComplexity == 'L') {
			return taskIds.large;
		}
		throw 'taskComplexity ' + taskComplexity + ' not handled.';
	}
	
	/**
	 * Takes an HTML li element and shows/hides child elements based on state
	 * @param html - HTML element
	 * @param state - String
	 * @return HTML element
	 */
	var updateTaskDisplayBasedOnState = function(html, state){
		
		var taskButtonBarDiv = html.children('.taskContainer').children('.taskButtonBar');
		if(state === 'new'){
			taskButtonBarDiv.children('#start-button').show();
			taskButtonBarDiv.children('#stop-button').hide();
			taskButtonBarDiv.children('#complete-button').hide();
			taskButtonBarDiv.children('#creation-date').show();
			taskButtonBarDiv.children('#start-date').hide();
			taskButtonBarDiv.children('#completion-date').hide();
		} else if(state === 'started'){
			taskButtonBarDiv.children('#start-button').hide();
			taskButtonBarDiv.children('#stop-button').show();
			taskButtonBarDiv.children('#complete-button').show();
			taskButtonBarDiv.children('#creation-date').hide();
			taskButtonBarDiv.children('#start-date').show();
			taskButtonBarDiv.children('#completion-date').hide();
		} else if(state === 'completed') {
			taskButtonBarDiv.children('#start-button').hide();
			taskButtonBarDiv.children('#stop-button').hide();
			taskButtonBarDiv.children('#complete-button').hide();
			taskButtonBarDiv.children('#creation-date').hide();
			taskButtonBarDiv.children('#start-date').hide();
			taskButtonBarDiv.children('#completion-date').show();
		}
		return html;
	}
	
	/**
	 * Creates an HTML element from a TaskListItem
	 * @param taskListItem - TaskListItem
	 * @return HTML element
	 */
    var generateElement = function(taskListItem){
		return $("<li id=" + taskListItem.id + " data-role='list-divider' style='background-color: " + getColorOfState(taskListItem.state) + "'><div class='taskContainer'><div class='taskButtonBar'><span id='remove-button'></span><span id='complete-button'></span><span id='start-button'></span><span id='stop-button'></span><span id='completion-date'>"+formatDate(taskListItem.completionDate)+"</span><span id='start-date'>"+formatDate(taskListItem.startDate)+"</span><span id='creation-date'>"+formatDate(taskListItem.creationDate)+"</span></div><div class='taskLabelContainer'><span id='"+getTaskId(taskListItem.complexity) + "'></span><div id='label-"+ taskListItem.id +"' class='taskLabel'>" + taskListItem.taskName + "</div></div></div></li>");
    };

	/**
	 * Adds a TaskListItem to the current page
	 * @param taskListItem - TaskListItem
	 */
	var addTaskToDisplay = function(taskListItem){
		var elem = generateElement(taskListItem);
		var listName = inProgressListName;
		if(taskListItem.state === 'completed') {
			listName = completedListName;
			//display the completed task header
			$('#completedTasksHeader').show();
		}
		$(listName).append(updateTaskDisplayBasedOnState(elem, taskListItem.state));
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
			var month = unformattedDate.getMonth();
			var date = unformattedDate.getDate();
			var day = unformattedDate.getDay();
			var formattedDate = dayOfWeekNames[day] + ' ' + monthNames[month] + ' ' + getDateOrdinalSuffix(date);
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
	 * Gets the task list data from the server and stores it into local storage
	 */
	var loadData = function(){
		console.log('loadData');
		
		// fire off the request
		request = $.ajax({
			url: getTaskListUrl,
			async: false,
			type: "post"
		});

		// callback handler that will be called on success
		request.done(function (response, textStatus, jqXHR){
			if(response) {
				console.log('loadData json received ');
				var jsonResponse = JSON.parse(response);
				setTaskList(JSON.parse(jsonResponse.task_list_string));
				setTaskListOrder(JSON.parse(jsonResponse.task_order_string));
				$('#undoButton').attr('disabled','disabled');
				console.log('local storage loaded');
			} else {
				console.log('loadData no json received');
			}
			setDirty(false);
		});

		// callback handler that will be called on failure
		request.fail(function (jqXHR, textStatus, errorThrown){
			// log the error to the console
			console.error(
				"The following error occured: "+
				textStatus, errorThrown
			);
		});
	}
	
	var updateStatistics = function() {
		var taskList = getTaskList();
		var newTaskCount = 0;
		var startedTaskCount = 0;
		var completedTaskCount = 0;
		if(taskList){
			$.each(taskList, function( id, task ) {
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
			});
		}
		$('#statsNewTaskCount').text(newTaskCount);
		$('#statsStartedTaskCount').text(startedTaskCount);
		$('#statsCompletedTaskCount').text(completedTaskCount);
		$('#statsTotalTaskCount').text(newTaskCount+startedTaskCount+completedTaskCount);
	}
	
	/**
	 * Creates and downloads a file with content
	 */
	function downloadFile(filename, textContent) {
		var pom = document.createElement('a');
		pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent));
		pom.setAttribute('download', filename);
		pom.click();
	}
	
	/********************
	 *  Initialization  *
	 ********************/
	
	var taskList;
	console.log('Initialization');
	localStorage.clear();
	localStorage.setItem('taskListIndex',-1);
	localStorage.setItem('taskListOrderIndex',-1);
	loadData();
	updateStatistics();
	/* Populate the task list from local storage */
	var populateTaskList = function() {
		taskList = getTaskList();
		taskList = taskList || {};
		//Clear existing lists
		$(inProgressListName).empty();
		$(completedListName).empty();
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
	}
	
	populateTaskList();
	
	/* Set up the sortable lists */
	$( '#sortableTodo, #sortableCompleted' ).sortable({
		cancel : 'span',
		update: function(event, ui) {
			setDirty(true);
			setTaskList(getTaskList());//This is to keep the undo indexes in order
			saveTaskListOrder(isAutosaveEnabled());
    }});
	
	/* Hook up the buttons inside each task */
	$('[id^=sortable]').on('click','li div div span', function () {
		var parentContainer = $(this).parent().parent().parent();
		var taskId = parentContainer.attr('id');

		if('complete-button' == this.id){
			parentContainer.css({'background-color': colors.completedstate});
			taskList[taskId].state = 'completed';
			taskList[taskId].completionDate = new Date().getTime();

			//Remove the task from the top list and add to the completed list
			parentContainer.remove();
			addTaskToDisplay(taskList[taskId]);
			//Scroll to the bottom
			//$('html, body').animate({ scrollTop: $(document).height() }, 'slow');
		} else if('start-button' == this.id){
			parentContainer.css({'background-color': colors.startedstate}); 
			taskList[taskId].state = 'started';
			taskList[taskId].startDate = new Date().getTime();
			//Get span and update startDate
			$(this).parent().children('#start-date').text(formatDate(taskList[taskId].startDate));
			updateTaskDisplayBasedOnState(parentContainer,taskList[taskId].state);
		} else if('stop-button' == this.id){
			parentContainer.css({'background-color': colors.newstate});
			taskList[taskId].state = 'new';
			updateTaskDisplayBasedOnState(parentContainer,taskList[taskId].state);
		} else if('remove-button' == this.id){
			parentContainer.remove();
			delete taskList[taskId];
		}
		setDirty(true);
		saveAll(taskList,isAutosaveEnabled());
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
		var creationDate = new Date().getTime();
		var taskName = $("input[id='addTaskTextField']").val();
		var complexity = $('#complexityComboBox :selected').text();
		var tempTaskItem = {
			id : id,
			taskName: taskName,
			complexity: complexity,
			creationDate: creationDate,
			startDate: '',
			completionDate: '',
			state: 'new'
		};
		
		taskList[id] = tempTaskItem;
		addTaskToDisplay(tempTaskItem);
		setDirty(true);
		//Scroll to the item
		//$('html, body').animate({
		//	scrollTop: $('#'+id).offset().top
		//}, 'slow');
		saveAll(taskList,isAutosaveEnabled());
		$('#addTaskTextField').val('');
	});
	
	/* Hook up the Save button */
	$('#saveButton').click(function (e) {
		e.preventDefault();
		saveAll(getTaskList(), true);
	});
	
	/* Hook up the Export button */
	$('#exportButton').click(function (e) {
		e.preventDefault();
		var contents = JSON.stringify(getTaskList()) + '\n' + JSON.stringify(getTaskListOrder());
		if(contents){
			var dateString = $.datepicker.formatDate('yy-mm-dd', new Date());
			downloadFile('task-list-'+dateString+'.txt', contents);
		} else {
			alert("Nothing to export");
		}
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
				var resultArray = fileReader.result.split('\n');
				if(resultArray.length == 2) {
					var taskList = resultArray[0];
					var taskListOrder = resultArray[1];
					try{
						JSON.parse(taskList);
						JSON.parse(taskListOrder);
					} catch(err) {
						alert('File contents not supported. Code J');
						return;
					}
					setTaskList(JSON.parse(taskList));
					setTaskListOrder(JSON.parse(taskListOrder));
					setDirty(true);
					populateTaskList();
				} else {
					alert('File contents not supported. Code N');
				}
			}   
			fileReader.readAsText(input.files[0]);
			//fileReader.readAsDataURL(file);
		}
	});
	
	/* Hook up the Clear All button */
	$('#clearAllButton').click(function (e) {
		e.preventDefault();
		setTaskList({});
		setTaskListOrder({});
		populateTaskList();
	});
	
	/* Hook up the Undo button */
	$('#undoButton').click(function (e) {
		e.preventDefault();
		var previousTaskListIndex = parseInt(localStorage.getItem('taskListIndex')) - 1;
		var previousTaskListOrderIndex = parseInt(localStorage.getItem('taskListOrderIndex')) - 1;
		console.log('undo previousTaskListIndex:' + previousTaskListIndex + ', previousTaskListOrderIndex:'+previousTaskListOrderIndex);
		if((previousTaskListIndex >=0) && (previousTaskListOrderIndex >=0)) {
			localStorage.setItem('taskListIndex',previousTaskListIndex);
			localStorage.setItem('taskListOrderIndex',previousTaskListOrderIndex);
			populateTaskList();
			if(isAutosaveEnabled()) {
				saveTaskListToDatabase(getTaskList());
				saveTaskListOrderToDatabase(getTaskListOrder());
			}
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
		console.log('redo nextTaskListIndex:' + nextTaskListIndex + ', nextTaskListOrderIndex:'+nextTaskListOrderIndex);
		if((nextTaskListIndex >=0) && (nextTaskListOrderIndex >=0) && localStorage.getItem('taskList-'+nextTaskListIndex) && localStorage.getItem('taskListOrder-'+nextTaskListOrderIndex)) {
			localStorage.setItem('taskListIndex',nextTaskListIndex);
			localStorage.setItem('taskListOrderIndex',nextTaskListOrderIndex);
			populateTaskList();
			if(isAutosaveEnabled()) {
				saveTaskListToDatabase(getTaskList());
				saveTaskListOrderToDatabase(getTaskListOrder());
			}
			$('#undoButton').removeAttr('disabled');
			//Check if the next indices exist. If not, disable redo button
			if(!(localStorage.getItem('taskList-'+(nextTaskListIndex+1)) && localStorage.getItem('taskListOrder-'+(nextTaskListOrderIndex+1)))){
				$('#redoButton').attr('disabled','disabled');
			}
		}
	});
	
	/* Connect the context menu to selectable rows */
	$.contextMenu({
        selector: '.taskContainer', 
        callback: function(key, options) {
            console.log('key: '+key);
			if('edit'===key){
				// Change the label into an input field
				var taskLabel = $(this).parent().find('.taskLabel');
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
						setDirty(true);
						var taskList = getTaskList();
						taskList[taskLabel.parent().parent().parent().attr('id')].taskName = inputFieldText;
						saveTaskList(taskList,isAutosaveEnabled());
						setTaskListOrder(getTaskListOrder());//This is to keep the undo indexes in order
					}
				}
				//On focus lost
				inputField.blur(function() {
				  replaceInputAndSave();
				});
				
				inputField.keypress(function(e) {
					if(e.which == 13) {
						//On Enter key pressed
						replaceInputAndSave();
					}
				});
				inputField.keydown(function(e) {
					if(e.which == 27) {
						//On Escape, restore text
						taskLabel.find('.removableDiv').remove();
						taskLabel.text(originalText);
					}
				});
			}
        },
        items: {
            "edit": {name: "Edit", icon: "edit"}
			/*,
            "cut": {name: "Cut", icon: "cut"},
            "copy": {name: "Copy", icon: "copy"},
            "paste": {name: "Paste", icon: "paste"},
            "delete": {name: "Delete", icon: "delete"},
            "sep1": "---------",
            "quit": {name: "Quit", icon: "quit"}*/
        }
    });
});
