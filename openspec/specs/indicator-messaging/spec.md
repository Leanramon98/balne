# Indicator Messaging Specification

## Purpose

Provide a messaging system within the indicator editor/view that allows users with evaluation access to communicate, with email notifications on new messages and clear behavior on promotion.

## Requirements

### Requirement: Messages Section

The system MUST display a messages section within the indicator editor and view, showing all messages for the indicator value.

#### Scenario: Messages visible in editor

- GIVEN the indicator editor is open
- WHEN the messages section renders
- THEN all previous messages SHALL display in chronological order (oldest first)
- AND each message SHALL show the sender's name, message text, and timestamp

#### Scenario: Messages visible in view

- GIVEN the indicator view page is open
- WHEN the messages section renders
- THEN all messages SHALL display in chronological order
- AND messages SHALL be read-only with no send input

### Requirement: Visibility by Access

Messages MUST be visible to all users who have access to the evaluation.

#### Scenario: Any access level can see messages

- GIVEN a user with any access level (Solo lectura, Carga, Evaluador, Administración) is viewing an indicator
- WHEN the messages section renders
- THEN all messages for that indicator SHALL be visible

#### Scenario: No access shows no messages

- GIVEN a user who does NOT have access to the evaluation
- WHEN they attempt to view the indicator
- THEN the messages section SHALL NOT be accessible

### Requirement: Send Message

The system MUST provide a text input and submit button in the editor to send new messages.

#### Scenario: Send message with text

- GIVEN the user is in the indicator editor
- WHEN the user types a message in the input and clicks "Enviar"
- THEN the API SHALL be called to create the message
- AND the new message SHALL appear at the end of the message list
- AND the input SHALL be cleared

#### Scenario: Send empty message prevented

- GIVEN the message input is empty
- WHEN the user clicks "Enviar"
- THEN the system SHALL NOT call the API
- AND the input SHALL show a validation indicator

### Requirement: Email Notification

The system MUST trigger an email notification when a new message is sent.

#### Scenario: Email notification on message

- GIVEN a user sends a new message
- WHEN the message is successfully created
- THEN the frontend SHALL trigger an email notification via API
- AND the notification SHALL be sent to all users with access to the evaluation (excluding the sender)

#### Scenario: Email notification failure

- GIVEN a user sends a new message
- WHEN the message is created successfully but the email notification fails
- THEN the message SHALL still appear in the list
- AND a warning toast SHALL indicate the notification could not be sent

### Requirement: Messages Not Copied on Promotion

Messages MUST NOT be copied when an evaluation is promoted to the next type.

#### Scenario: Promoted evaluation has no messages

- GIVEN an evaluation was promoted from a source evaluation that had messages
- WHEN the new evaluation's indicator page loads
- THEN the messages section SHALL be empty
- AND the system SHALL NOT copy any messages from the source evaluation
