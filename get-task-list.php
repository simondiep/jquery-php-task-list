<?php 

    // First we execute our common code to connection to the database and start the session 
    require("common.php"); 
     
    // At the top of the page we check to see whether the user is logged in or not 
    if(empty($_SESSION['user'])) 
    { 
        // if not logged in, return back empty
        die("");
    } 
     
    // Everything below this point in the file is secured by the login system 
    $taskListQuery = "Select task.id,task_name,complexity,state,creation_date,due_date,start_date,completion_date
            FROM task INNER JOIN task_ownership  ON task.id = task_ownership.task_id 
            WHERE user_id = :user_id"; 
            
    $taskListOrderQuery = "Select task_list_order from task_list_order 
            WHERE user_id = :user_id"; 
    $query_params = array( 
        ':user_id' => $_SESSION['user']['id'], 
    );
    try 
    { 
        // These two statements run the query against your database table. 
        $stmt = $db->prepare($taskListQuery); 
        $stmt->execute($query_params); 
        $taskList = array();
        
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $task) {
            $taskList[$task['id']] = $task;
        }
        
        $stmt = $db->prepare($taskListOrderQuery); 
        $stmt->execute($query_params); 
        $taskListOrder = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    } 
    catch(PDOException $ex) 
    { 
        // Note: On a production website, you should not output $ex->getMessage(). 
        // It may provide an attacker with helpful information about your code.  
        die("Failed to run query: " . $ex->getMessage()); 
    } 
         
    // Retrieve results (if any) 
    $results = $stmt->fetchAll(); 
    $returnValues = new stdClass();
    if($taskList && $taskListOrder) 
    { 
        $returnValues->task_list = $taskList;
        $returnValues->task_list_order = $taskListOrder;
        echo json_encode($returnValues);
    }
    else
    {
        echo "";
    }
?>