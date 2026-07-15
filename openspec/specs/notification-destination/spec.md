# Notification Destination Specification

## Purpose

Provide a dedicated action for ADMIN users to send an email notification to the evaluation's destination, with a confirmation modal and success/failure feedback.

## Requirements

### Requirement: Notify Destination Button

The system MUST display a "Notificar destino" button visible to ADMIN (`admin_global`) and `admin_destino` users.

#### Scenario: admin_global sees notify button

- GIVEN the current user has role `admin_global`
- WHEN viewing an evaluation detail page
- THEN a "Notificar destino" button SHALL be visible in the actions area

#### Scenario: admin_destino sees notify button

- GIVEN the current user has role `admin_destino`
- WHEN viewing an evaluation detail page
- THEN a "Notificar destino" button SHALL be visible in the actions area

#### Scenario: Non-admin user does not see notify button

- GIVEN the current user has a role other than `admin_global` or `admin_destino`
- WHEN viewing an evaluation detail page
- THEN the "Notificar destino" button SHALL NOT be visible

### Requirement: Confirmation Modal

The system MUST show a confirmation modal when the notify button is clicked.

#### Scenario: Confirmation modal appears

- GIVEN the ADMIN user clicks "Notificar destino"
- WHEN the action is triggered
- THEN a modal SHALL appear with the message "Se enviará una notificación por email al destino X" where X is the destination name
- AND the modal SHALL have "Confirmar" and "Cancelar" buttons

#### Scenario: Cancel notification

- GIVEN the confirmation modal is displayed
- WHEN the user clicks "Cancelar"
- THEN the modal SHALL close
- AND no API call SHALL be made

### Requirement: API Call

The system MUST call the notify destination API endpoint when the action is confirmed. The backend `HandleNotifyDestination` MUST allow execution for users with role `admin_destino` in addition to `admin_global`.

#### Scenario: Successful notification

- GIVEN the ADMIN user confirms the notification
- WHEN the API call succeeds
- THEN a success toast SHALL appear: "Notificación enviada a [destination name]"

#### Scenario: Failed notification

- GIVEN the ADMIN user confirms the notification
- WHEN the API call fails
- THEN an error toast SHALL appear with the error message
