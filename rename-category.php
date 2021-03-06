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

    $query = "UPDATE category SET name = :new_category_name WHERE name = :old_category_name AND user_id = :user_id";
    
    try 
    { 
        // Execute the query 
        $stmt = $db->prepare($query); 
        $stmt->bindParam(':old_category_name', $_POST['old_category_name']);
        $stmt->bindParam(':new_category_name', $_POST['new_category_name']);
        $stmt->bindParam(':user_id', $_SESSION['user']['id']);
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