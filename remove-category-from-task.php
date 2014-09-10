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
	
	try 
	{ 
		$stmt = $db->prepare('SELECT id FROM category WHERE user_id = :user_id AND name = :category_name'); 
		$stmt->bindParam(':category_name', $_POST['category_name']);
		$stmt->bindParam(':user_id', $_SESSION['user']['id']);
		$result = $stmt->execute(); 
		$categoryId = $stmt->fetch(PDO::FETCH_COLUMN, 0); 
	
		$stmt = $db->prepare('DELETE FROM categorized_task WHERE category_id = :category_id AND task_id = :task_id'); 
		$stmt->bindParam(':category_id', $categoryId);
		$stmt->bindParam(':task_id', $_POST['task_id']);
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