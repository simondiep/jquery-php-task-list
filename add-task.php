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
    
    $task = json_decode($_POST['task']);
    try 
    { 
        $query = " 
            INSERT INTO task(task_name,complexity,state,creation_date,due_date,start_date,completion_date)
                VALUES (:task_name,:complexity,:state,:creation_date,:due_date,:start_date,:completion_date)";
        
        $stmt = $db->prepare($query); 
        $stmt->bindParam(':task_name', $task->task_name);
        $stmt->bindParam(':complexity', $task->complexity);
        $stmt->bindParam(':state', $task->state);
        $stmt->bindParam(':creation_date', $task->creation_date);
        
        if(empty($task->due_date)){
            $task->due_date = null;
        }
        if(empty($task->start_date)){
            $task->start_date = null;
        }
        if(empty($task->completion_date)){
            $task->completion_date = null;
        }
        $stmt->bindParam(':due_date', $task->due_date);
        $stmt->bindParam(':start_date', $task->start_date);
        $stmt->bindParam(':completion_date', $task->completion_date);

        $result = $stmt->execute(); 
        $taskId = $db->lastInsertId();
        
        // Insert/update task_ownership
        $stmt = $db->prepare('INSERT INTO task_ownership(task_id,user_id) VALUES (:task_id,:user_id) ON DUPLICATE KEY UPDATE task_id = VALUES(task_id), user_id = VALUES(user_id)'); 
        $stmt->bindParam(':task_id', $taskId);
        $stmt->bindParam(':user_id', $_SESSION['user']['id']);
        $result = $stmt->execute(); 
        
        echo $taskId;
    } 
    catch(PDOException $ex) 
    { 
        error_log($ex);
        // Note: On a production website, you should not output $ex->getMessage(). 
        // It may provide an attacker with helpful information about your code.  
        die("Failed to run query: " . $ex->getMessage()); 
    }
?>