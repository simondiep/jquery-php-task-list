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
     
	// Note how this is only first half of the necessary update query.  We will dynamically 
	// construct the rest of it depending on whether or not the user is changing 
	// their password. 
	$query = " 
		INSERT INTO task_list (user_id,task_order_string) 
		VALUES (:user_id,:task_order_string) 
		ON DUPLICATE KEY UPDATE task_order_string=:task_order_string2";
	try 
	{ 
		// Execute the query 
		$stmt = $db->prepare($query); 
		$stmt->bindParam(':user_id', $_SESSION['user']['id']);
		$stmt->bindParam(':task_order_string', file_get_contents("php://input"));
		$stmt->bindParam(':task_order_string2', file_get_contents("php://input"));
		$result = $stmt->execute(); 
	} 
	catch(PDOException $ex) 
	{ 
		error_log($ex);
		// Note: On a production website, you should not output $ex->getMessage(). 
		// It may provide an attacker with helpful information about your code.  
		die("Failed to run query: " . $ex->getMessage()); 
	}
?>