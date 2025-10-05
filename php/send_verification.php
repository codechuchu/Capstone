<?php
session_start();
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php'; // Make sure PHPMailer is installed via Composer

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];

    // Generate a random token
    $token = bin2hex(random_bytes(16));

    // Store token in session for temporary verification
    $_SESSION['email_verification'] = [
        'email' => $email,
        'token' => $token,
        'expires' => time() + 600 // 10 minutes
    ];

    // Prepare verification link
    $verification_link = "http://yourdomain.com/verify_email.php?token=$token";

    // Send email using PHPMailer
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';  // Your SMTP server
        $mail->SMTPAuth   = true;
        $mail->Username   = 'onionknight418@gmail.com'; // Your email
        $mail->Password   = 'lmke ipfx oqnq zbpk'; // Your email password or app password
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        $mail->setFrom('no-reply@yourdomain.com', 'Demo Site');
        $mail->addAddress($email);

        $mail->isHTML(true);
        $mail->Subject = 'Email Verification';
        $mail->Body    = "Click this link to verify your email: <a href='$verification_link'>Verify Email</a>";

        $mail->send();
        echo "Verification email sent to $email. Please check your inbox!";
    } catch (Exception $e) {
        echo "Mailer Error: {$mail->ErrorInfo}";
    }
} else {
    echo "Invalid request!";
}
