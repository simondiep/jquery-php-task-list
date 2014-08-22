<?php 

    // First we execute our common code to connection to the database and start the session 
    require("common.php"); 
     
    // At the top of the page we check to see whether the user is logged in or not 
    if(empty($_SESSION['user'])) 
    { 
        // If they are not, we redirect them to the signin page. 
        header("Location: signin.php"); 
         
        // Remember that this die statement is absolutely critical.  Without it, 
        // people can view your members-only content without logging in. 
        die("Redirecting to signin.php"); 
    } 
     
    // Everything below this point in the file is secured by the signin system 
     
    // We can display the user's username to them by reading it from the session array.  Remember that because 
    // a username is user submitted content we must use htmlentities on it before displaying it to the user. 
?> 
<head>
	<meta name="viewport" content="initial-scale=1.0">
	<meta charset="utf-8">
	<title>Task List</title>
	<!--<link rel="stylesheet" href="css/jquery.mobile-1.4.2.min.css">-->
	<link rel="stylesheet" href="css/jquery.contextMenu.css" />
	<link rel="stylesheet" type="text/css" href="css/bootstrap.css" media="screen" />
	<link rel="stylesheet" href="css/index.css" />
	<link rel="icon" href="assets/favicon.ico" type="image/x-icon" />
	<script src="js/jquery-2.1.0.min.js"></script>
	<script src="js/jquery.ui.position.js"></script>
	<script src="js/jquery.contextMenu.js"></script>
	<script src="js/jquery.fileDownload.js"></script>
	<!--<script src="js/jquery.mobile-1.4.2.min.js"></script>-->
	<script src="js/jquery-ui-1.10.4.min.js"></script>
	<script src="js/jquery-ui-touch-punch-0.2.3.js"></script>
	<script src="js/task-list-base.js"></script>
	<script src="js/bootstrap.min.js"></script>
	<script type="text/javascript">
	$(document).ready(function() {
		document.getElementById("signOutButton").onclick = function () {
			location.href = "signout.php";
		};
		
		$.ajaxSetup({
			beforeSend: function() {
				$('#loading-indicator').show();
				console.log('show');
			},
			complete: function() {
				$('#loading-indicator').hide();
				console.log('hide');
			}
		});
	});
	</script>
</head>
<body>
	<header>
		<nav class="navbar navbar-transparent navbar-fixed-top" role="navigation">
			<div class="container-fluid">
			  <ul class="nav navbar-nav">
				<li><p class="navbar-text"><input id="autosaveCheckbox" type="checkbox"> Auto-save</p></li>
				<li><button id='saveButton' class="btn btn-default navbar-btn">Save Now</button></li>
				<li><button id='exportButton' class="btn btn-default navbar-btn">Export</button></li>
				<li><span class="btn btn-default navbar-btn btn-file">Import<input type="file" id='importFileInput' accept=".txt"></span></li>
				<li><button id='startOverButton' class="btn btn-default navbar-btn">Start Over</button></li>
				<li><button id='undoButton' class="btn btn-default navbar-btn" disabled='disabled'>Undo</button></li>
				<li><button id='redoButton' class="btn btn-default navbar-btn" disabled='disabled'>Redo</button></li>
			  </ul>
			  <ul class="nav navbar-nav navbar-right container-fluid">
				<li><img src="assets/loading.gif" id="loading-indicator" style="display:none" /></li>
				<li><p class="navbar-text">Signed in as <?php echo htmlentities($_SESSION['user']['username'], ENT_QUOTES, 'UTF-8'); ?></p></li>
				<li><button id='signOutButton' type="submit" class="btn btn-default navbar-btn">Sign Out</button></li>
			  </ul>
			</div><!-- /.container-fluid -->
		</nav>
		<h1>Task List</h1>
	</header>
	<div id='taskListContainer' class="container narrow">
		<div id="addTask">
			<form class="form-inline" role="form">
				<div class="form-group">
					<label class="sr-only" for="addTaskTextField">Task Name</label>
					<input type="text" class="form-control" id="addTaskTextField" placeholder="Enter task">
				</div>
				<div class="form-group">
					<select id="complexityComboBox" class="form-control">
						<option>S</option>
						<option>M</option>
						<option>L</option>
					</select>
				</div>
				<button id='addTaskButton' type="submit" class="btn btn-default">Add Task</button>
			</form>
		</div>
		<ul id="sortableTodo" class="sortable"></ul>
		<div id="completedTasksHeader">
			<span id="completedLabel">Completed Tasks</span>
			<span id="lastDateLabel">Completion Date</span>
		</div>
		<ul id="sortableCompleted" class="sortable">
		</ul>
	</div>
	<div class="container narrow improvement-list">
		<h2>Improvements TODO list</h2>
		<ul id="features">
			<li>Add filter methods (and a filter db table?)</li>
			<li>Add stats such as number of tasks, completed tasks</li>
			<li>Add modular content onto sides</li>
			<li>Make it work for mobile (stretch elements further)</li>
			<li>Export to PDP button</li>
			<li>Share list with others</li>
			<li>Add grouping (this week's tasks as a sidebar extension (==|, monday's tasks as a dropdown)</li>
			<li>Add optional deadline for tasks (due in 3 days)</li>
			<li>Organize completed tasks by week through tabs</li>
			<li>Change Create/start/completion date display on right click</li>
			<li>On right click, add option to edit text</li>
			<li>update list items to use scalable images instead of rectangles</li>
			<li>Add dropdown to control where a new task should go into the list (top/bottom)</li>
		</ul>
	</div>
</body>
</html>