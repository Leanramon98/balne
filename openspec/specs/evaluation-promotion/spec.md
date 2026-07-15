# Evaluation Promotion Specification

## Purpose

Provide a dedicated promotion flow that copies indicator data from a closed evaluation to the next type in the cycle, with clear communication of what is and is not copied.

## Requirements

### Requirement: Promotion Page

The system MUST provide a dedicated promotion page showing the origin evaluation information.

#### Scenario: Navigate to promotion page

- GIVEN the user clicks "Promover" on an evaluation in Cerrada state
- WHEN the action is triggered
- THEN the system SHALL navigate to the dedicated promotion page
- AND display the origin evaluation name, type, and dates

#### Scenario: Promote from non-closed evaluation

- GIVEN the user is on an evaluation NOT in Cerrada state
- WHEN the page renders
- THEN the "Promover" action SHALL NOT be available

### Requirement: Promotion Information Display

The system MUST show what will be copied (indicators, actions, history) and what will NOT be copied (messages, AI analysis).

#### Scenario: Promotion info lists copied items

- GIVEN the promotion page loads with a valid origin evaluation
- WHEN the page renders
- THEN a section SHALL list items that WILL be copied: indicator values, linked actions, observation history
- AND a section SHALL list items that will NOT be copied: messages, AI analysis results

### Requirement: Execute Promotion

The system MUST call the promote API endpoint and handle success and failure outcomes.

#### Scenario: Successful promotion

- GIVEN the user confirms promotion on the promotion page
- WHEN the promote API call succeeds
- THEN the system SHALL redirect to the new evaluation's detail page
- AND display a success toast with the new evaluation name and type

#### Scenario: Failed promotion

- GIVEN the user confirms promotion on the promotion page
- WHEN the promote API call fails (e.g., origin not closed, destination type conflict)
- THEN the system SHALL display an error toast with the error message
- AND remain on the promotion page

### Requirement: Origin Must Be Cerrada

The system MUST enforce that promotion is only available when the origin evaluation is in Cerrada state.

#### Scenario: Origin not closed prevents promotion

- GIVEN the promotion page loads
- WHEN the origin evaluation status is NOT Cerrada
- THEN the promote button SHALL be disabled
- AND a message SHALL explain that the evaluation must be closed to promote
