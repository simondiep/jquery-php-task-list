<?php
    session_start();
    $code=rand(1000,9999);
    $_SESSION["code"]=$code;
    $im = imagecreatetruecolor(50, 24);
    $bg = imagecolorallocate($im, 255, 255, 255); //background color
    $fg = imagecolorallocate($im, 85, 85, 85);//text color
    imagefill($im, 0, 0, $bg);
    imagestring($im, 5, 5, 5,  $code, $fg);
    header("Cache-Control: no-cache, must-revalidate");
    header('Content-type: image/png');
    imagepng($im);
    imagedestroy($im);
?>