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
    $query = "Select name FROM category WHERE user_id = :user_id"; 
    $query_params = array( 
        ':user_id' => $_SESSION['user']['id'], 
    );
    try 
    { 
        // These two statements run the query against your database table. 
        $stmt = $db->prepare($query); 
        $stmt->execute($query_params); 
    } 
    catch(PDOException $ex) 
    { 
        // Note: On a production website, you should not output $ex->getMessage(). 
        // It may provide an attacker with helpful information about your code.  
        die("Failed to run query: " . $ex->getMessage()); 
    } 
         
    // Retrieve results (if any) 
    $result = $stmt->fetchAll(); 
    if($result) 
    { 
        echo json_encode($result);
    }
    else
    {
        echo "";
    }
?>