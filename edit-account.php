<?php 

    // First we execute our common code to connection to the database and start the session 
    require("common.php"); 
     
	$ERROR_EMAIL = '';
    // At the top of the page we check to see whether the user is logged in or not 
    if(empty($_SESSION['user'])) 
    { 
        // If they are not, we redirect them to the login page. 
        header("Location: signin.php"); 
         
        // Remember that this die statement is absolutely critical.  Without it, 
        // people can view your members-only content without logging in. 
        die("Redirecting to signin.php"); 
    } 
     
    // This if statement checks to determine whether the edit form has been submitted 
    // If it has, then the account updating code is run, otherwise the form is displayed 
    if(!empty($_POST)) 
    { 
        // Make sure the user entered a valid E-Mail address 
        if(!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) 
        { 
            $ERROR_EMAIL='Invalid E-Mail Address'; 
        } 
         
        // If the user is changing their E-Mail address, we need to make sure that 
        // the new value does not conflict with a value that is already in the system. 
        // If the user is not changing their E-Mail address this check is not needed. 
        if(empty($ERROR_EMAIL) && $_POST['email'] != $_SESSION['user']['email']) 
        { 
            // Define our SQL query 
            $query = " 
                SELECT 
                    1 
                FROM users 
                WHERE 
                    email = :email 
            "; 
             
            // Define our query parameter values 
            $query_params = array( 
                ':email' => $_POST['email'] 
            ); 
             
            try 
            { 
                // Execute the query 
                $stmt = $db->prepare($query); 
                $result = $stmt->execute($query_params); 
            } 
            catch(PDOException $ex) 
            { 
                // Note: On a production website, you should not output $ex->getMessage(). 
                // It may provide an attacker with helpful information about your code.  
                die("Failed to run query: " . $ex->getMessage()); 
            } 
             
            // Retrieve results (if any) 
            $row = $stmt->fetch(); 
            if($row) 
            { 
                $ERROR_EMAIL='This email address is already registered'; 
            } 
        } 
         
		if(empty($ERROR_EMAIL))
		{
			// If the user entered a new password, we need to hash it and generate a fresh salt 
			// for good measure. 
			if(!empty($_POST['password'])) 
			{ 
				$salt = dechex(mt_rand(0, 2147483647)) . dechex(mt_rand(0, 2147483647)); 
				$password = hash('sha256', $_POST['password'] . $salt); 
				for($round = 0; $round < 65536; $round++) 
				{ 
					$password = hash('sha256', $password . $salt); 
				} 
			} 
			else 
			{ 
				// If the user did not enter a new password we will not update their old one. 
				$password = null; 
				$salt = null; 
			} 
			 
			// Initial query parameter values 
			$query_params = array( 
				':email' => $_POST['email'], 
				':user_id' => $_SESSION['user']['id'],
				':background_class' => $_POST['backgroundSelect'] 
			); 
			 
			// If the user is changing their password, then we need parameter values 
			// for the new password hash and salt too. 
			if($password !== null) 
			{ 
				$query_params[':password'] = $password; 
				$query_params[':salt'] = $salt; 
			} 
			 
			// Note how this is only first half of the necessary update query.  We will dynamically 
			// construct the rest of it depending on whether or not the user is changing 
			// their password. 
			$query = " 
				UPDATE users 
				SET 
					email = :email,
					background_class = :background_class
			"; 
			 
			// If the user is changing their password, then we extend the SQL query 
			// to include the password and salt columns and parameter tokens too. 
			if($password !== null) 
			{ 
				$query .= " 
					, password = :password 
					, salt = :salt 
				"; 
			} 
			 
			// Finally we finish the update query by specifying that we only wish 
			// to update the one record with for the current user. 
			$query .= " 
				WHERE 
					id = :user_id 
			"; 
			 
			try 
			{ 
				// Execute the query 
				$stmt = $db->prepare($query); 
				$result = $stmt->execute($query_params); 
			} 
			catch(PDOException $ex) 
			{ 
				// Note: On a production website, you should not output $ex->getMessage(). 
				// It may provide an attacker with helpful information about your code.  
				die("Failed to run query: " . $ex->getMessage()); 
			} 
			 
			// Now that the user's E-Mail address has changed, the data stored in the $_SESSION 
			// array is stale; we need to update it so that it is accurate. 
			$_SESSION['user']['email'] = $_POST['email']; 
			$_SESSION['user']['background_class'] = $_POST['backgroundSelect']; 
			 
			// This redirects the user back to the members-only page after they register 
			header("Location: main.php"); 
			 
			// Calling die or exit after performing a redirect using the header function 
			// is critical.  The rest of your PHP script will continue to execute and 
			// will be sent to the user if you do not die or exit. 
			die("Redirecting to main.php"); 
		}
    } 
     
?> 
<head>
	<meta name="viewport" content="initial-scale=1.0">
	<meta charset="utf-8">
	<title>Task List</title>
	<link rel="stylesheet" href="css/index.css" />
	<!--<link rel="stylesheet" href="css/jquery.mobile-1.4.2.min.css">-->
	<link rel="stylesheet" type="text/css" href="css/bootstrap.css" media="screen" />
	<link rel="icon" href="assets/favicon.ico" type="image/x-icon" />
	<script type="text/javascript">
		function changeBackground() {
			var backgroundDropdown = document.getElementById('backgroundSelect');
			var selectedBackground = backgroundDropdown.options[backgroundDropdown.selectedIndex].value;
			document.body.className = selectedBackground;
			determineStyles();
		}
		
		function determineStyles() {
			//Determine color style based on background color
			if(document.body.classList.contains('lighted-night-background') || document.body.classList.contains('carbon-fiber-background') || document.body.classList.contains('dark-gray-background')){
				//Dark style
				document.getElementsByTagName('header')[0].style.color = 'white';
			} else {
				//Light style
				document.getElementsByTagName('header')[0].style.color = '#333';
			}
		}
	</script>
</head>
<body class="<?php echo htmlentities($_SESSION['user']['background_class'], ENT_QUOTES, 'UTF-8'); ?>" onload="determineStyles()">
<header> 
	<h1>Edit Account</h1>
</header>
	<div class="container-narrow jumbotron">
		<form action="edit-account.php" method="post"> 
			<?php if (!empty($ERROR_USERNAME)) : ?>
				<span class="validation-message"><?php echo htmlentities($ERROR_USERNAME, ENT_QUOTES, 'UTF-8'); ?></span>
			<?php endif; ?>
			<div class="form-group">
				<label for="usernameTextField">Username</label>
				<input name="username" type="text" class="form-control" id="usernameTextField" placeholder="Username" value="<?php echo htmlentities($_SESSION['user']['username'], ENT_QUOTES, 'UTF-8'); ?>" disabled/>
			</div>
			<?php if (!empty($ERROR_EMAIL)) : ?>
				<span class="validation-message"><?php echo htmlentities($ERROR_EMAIL, ENT_QUOTES, 'UTF-8'); ?></span>
			<?php endif; ?>
			<div class="form-group">
				<label for="emailTextField">Email Address</label>
				<input name="email" type="email" class="form-control" id="emailTextField" placeholder="Email Address" value="<?php echo htmlentities($_SESSION['user']['email'], ENT_QUOTES, 'UTF-8'); ?>" required/>
			</div>
			<div class="form-group">
				<label for="passwordTextField">Password</label>
				<i>(leave blank if you do not want to change your password)</i>
				<input name="password" type="password" class="form-control" id="passwordTextField" placeholder="Password" value="" pattern=".{8,}" title="8 character minimum"/>
			</div>
			<div class="form-group">
				<label for="backgroundSelect">Select a Background Style</label>
				<select id="backgroundSelect" name="backgroundSelect" class="form-control" onchange="changeBackground()">
					<option value="lighted-night-background" <?php if('lighted-night-background' == $_SESSION['user']['background_class']) echo 'selected="selected"';?>>Lighted Night</option>
					<option value="carbon-fiber-background" <?php if('carbon-fiber-background' == $_SESSION['user']['background_class']) echo 'selected="selected"';?>>Carbon Fiber</option>
					<option value="dark-gray-background" <?php if('dark-gray-background' == $_SESSION['user']['background_class']) echo 'selected="selected"';?>>Dark Gray</option>
					<option value="light-gray-background" <?php if('light-gray-background' == $_SESSION['user']['background_class']) echo 'selected="selected"';?>>Light Gray</option>
					<option value="peach-background" <?php if('peach-background' == $_SESSION['user']['background_class']) echo 'selected="selected"';?>>Peach</option>
					<option value="sky-blue-background" <?php if('sky-blue-background' == $_SESSION['user']['background_class']) echo 'selected="selected"';?>>Sky Blue</option>
					<option value="white-background" <?php if('white-background' == $_SESSION['user']['background_class']) echo 'selected="selected"';?>>White</option>
				</select>
			</div>
			<button id='saveButton' type="submit" class="btn btn-default pull-right">Update Account</button>
		</form>
		<button id='cancel' class="btn btn-default pull-left" onclick="location.href = 'main.php'">Cancel</button>
	</div>
</body>