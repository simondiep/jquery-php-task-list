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
<html>
<head>
	<meta name="viewport" content="initial-scale=1.0">
	<meta charset="utf-8">
	<title>Task List</title>
	<!--<link rel="stylesheet" href="css/jquery.mobile-1.4.2.min.css">-->
	<link rel="stylesheet" href="css/jquery.contextMenu.css" />
	<link rel="stylesheet" type="text/css" href="css/bootstrap.css" media="screen" />
	<link rel="stylesheet" href="css/jasny-bootstrap.css" />
	<link rel="stylesheet" href="css/bootstrap-datetimepicker.css" />
	<link rel="stylesheet" href="css/index.css" />
	<link rel="icon" href="assets/favicon.ico" type="image/x-icon" />
	<script src="js/jquery-2.1.0.min.js"></script>
	<script src="js/jquery.ui.position.js"></script>
	<script src="js/jquery.contextMenu.js"></script>
	<script src="js/jquery.fileDownload.js"></script>
	<script src="js/jquery-ui-1.10.4.min.js"></script>
	<script src="js/jquery-ui-touch-punch-0.2.3.js"></script>
	<script src="js/task-list-base.js"></script>
	<script src="js/bootstrap.min.js"></script>
	<script src="js/jasny-bootstrap.js"></script>
	<script src="js/moment.js"></script>
	<script src="js/bootstrap-datetimepicker.js"></script>
	<script type="text/javascript">
	$(document).ready(function() {
		$.ajaxSetup({
			beforeSend: function() {
				$('#loading-indicator').show();
			},
			complete: function() {
				$('#loading-indicator').hide();
			}
		});
		
		//Determine color style based on background color
		if($('body').hasClass('lighted-night-background') || $('body').hasClass('carbon-fiber-background') || $('body').hasClass('dark-gray-background')){
			//Dark style
			$('header').css('color','white');
			$('nav').addClass('navbar-inverse');
			$('.side-panel').addClass('navbar-inverse');
			$('.side-panel h4').css('color','white');
			$('.offcanvas label').css('color','white');
		} else {
			//Light style
			$('header').css('color','#333');
			$('nav').addClass('navbar-default');
			$('.side-panel').addClass('navbar-default');
			$('.side-panel h4').css('color','#333');
			$('.offcanvas label').css('color','#333');
		}
	});
	</script>
</head>
<body class="navbar-body <?php echo htmlentities($_SESSION['user']['background_class'], ENT_QUOTES, 'UTF-8'); ?>">
	<nav class="navbar navbar-fixed-top" role="navigation">
		<div class="container-fluid">
			<div class="navbar-header">
				<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#navbar-collapse-1">
				<span class="sr-only">Toggle navigation</span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				</button>
			</div>

				<!-- Collect the nav links, forms, and other content for toggling -->
			<div class="collapse navbar-collapse" id="navbar-collapse-1">
				<ul class="nav navbar-nav">
					<li style='display:none'><label class="navbar-text"><input id="autosaveCheckbox" type="checkbox" checked> Auto-save</label></li>
					<li style='display:none'><button id='saveButton' class="btn btn-default navbar-btn">Save Now</button></li>
					<li style='display:none'><button id='exportButton' class="btn btn-default navbar-btn">Export</button></li>
					<li style='display:none'><span class="btn btn-default navbar-btn btn-file">Import<input type="file" id='importFileInput' accept=".txt"></span></li>
					<li><button id='clearAllButton' class="btn btn-default navbar-btn">Clear All</button></li>
					<li><button id='undoButton' class="btn btn-default navbar-btn" disabled='disabled'>Undo</button></li>
					<li><button id='redoButton' class="btn btn-default navbar-btn" disabled='disabled'>Redo</button></li>
				</ul>
					<ul class="nav navbar-nav navbar-right container-fluid">
					<li><img src="assets/loading.gif" id="loading-indicator" style="display:none" /></li>
					<li><p class="navbar-text unselectable">Signed in as <b><?php echo htmlentities($_SESSION['user']['username'], ENT_QUOTES, 'UTF-8'); ?></b></p></li>
					<li><button id='editAccountButton' class="btn btn-default navbar-btn" onclick="location.href = 'edit-account.php'">Edit Account</button></li>
					<li><button id='signOutButton' class="btn btn-default navbar-btn" onclick="location.href = 'signout.php'">Sign Out</button></li>
				</ul>
			</div><!-- /.navbar-collapse -->
		</div><!-- /.container-fluid -->
	</nav>
	<nav>
		<button type="button" class="btn btn-default filter-side-button" data-toggle="offcanvas" data-target="#filter-nav-menu" data-canvas="body">More</button>
	</nav>
	<header class='unselectable'>
		<h1>Task List</h1>
	</header>
	<nav id="filter-nav-menu" class="navmenu navmenu-fixed-left offcanvas" role="navigation">
	  <label class="navmenu-brand">Filter</label>
	  <ul class="nav navmenu-nav">
		<li><label><input id="filterSmallCheckbox" type="checkbox" checked> Show Small Tasks</label><div class="small-task"></div></li>
		<li><label><input id="filterMediumCheckbox" type="checkbox" checked> Show Medium Tasks</label><div class="medium-task"></div></li>
		<li><label><input id="filterLargeCheckbox" type="checkbox" checked> Show Large Tasks</label><div class="large-task"></div></li>
		<li><label><input id="filterThisWeekCheckbox" type="checkbox"> Only Show Activity For This Week</label></li>
		<hr/>
		<label class="navmenu-brand">Stats</label>
		<li><div id="statsNewTaskCount" class="task-count new-task-count"></div><label>New</label></li>
		<li><div id="statsStartedTaskCount" class="task-count started-task-count"></div><label>Started</label></li>
		<li><div id="statsCompletedTaskCount" class="task-count completed-task-count"></div><label>Completed</label></li>
		<li><div id="statsTotalTaskCount" class="task-count new-task-count"></div><label>Total</label></li>
	  </ul>
	</nav>

	<div class="side-panel">
		<h4 class="text-center">Add Category</h4>
		<form class="form-inline" role="form">
			<div class="input-group">
				<input type="text" class="form-control" id="newCategoryTextField" placeholder="Enter new Category"></input>
				<label class="sr-only" for="newCategoryTextField">New Category</label>
				<div class="input-group-btn">
					<button id='addNewCategoryButton' type="submit" class="btn btn-default" disabled>Add</button>
				</div>
			</div>
		</form>
		<h4 class="text-center">Filter By Category</h4>
		<div class="list-group category-list">
		</div>
		<div class="btn-group btn-group-justified">
			<a id='renameCategoryButton' class="btn btn-default" disabled>Rename</a>
			<a id='deleteCategoryButton' class="btn btn-default" disabled>Delete</a>
		</div>
	</div>
	<div id='taskListContainer' class="indent-side">
		<div id="addTask">
			<form class="form-inline" role="form">
				<div class="input-group">
					<div class="input-group-btn">
						<select id="complexityComboBox" class="form-control">
							<option>S</option>
							<option>M</option>
							<option>L</option>
						</select>
					</div>
					<label class="sr-only" for="addTaskTextField">Task Name</label>
					<input type="text" class="form-control" id="addTaskTextField" placeholder="Enter task">
					<div class="input-group-btn">
						<button id='addTaskButton' type="submit" class="btn btn-default" disabled>Add Task</button>
					</div>
				</div>
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
</body>
</html>