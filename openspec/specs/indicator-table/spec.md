# Indicator Table Specification

## Purpose

Display all indicators within a scope as a searchable, filterable table with progress header, row actions, and export functionality to clipboard, Excel, and PDF.

## Requirements

### Requirement: Table Header with Scope Progress

The system MUST display a header showing the scope icon, scope name, completed/total count, and overall percentage.

#### Scenario: Header renders with progress data

- GIVEN the user navigates to a scope's indicator page
- WHEN the page loads
- THEN a header SHALL display the scope icon and name
- AND show the "X/Y" completed indicator count
- AND show the total completion percentage

#### Scenario: Header with zero progress

- GIVEN the scope has no completed indicators
- WHEN the page loads
- THEN the header SHALL display "0/Y" and "0%"

### Requirement: Indicator Columns

The system MUST display indicators in a table with columns: Requisito (code + tooltip with name), Código, Nombre, Eje (code+name), Cumplimentado (check/X), Valor destino, Valor evaluador, Verificado.

#### Scenario: Table renders all columns

- GIVEN indicators exist for the scope
- WHEN the table loads
- THEN all specified columns SHALL render
- AND the Requisito column SHALL show the code with a tooltip showing the requirement name on hover
- AND the Cumplimentado column SHALL show a checkmark icon for completed or an X for not completed
- AND the Verificado column SHALL show a checkmark if the evaluator verified the indicator

#### Scenario: Table with no indicators

- GIVEN no indicators exist for the scope
- WHEN the table loads
- THEN a message SHALL indicate no indicators found
- AND the table header SHALL still be visible

### Requirement: Row Actions

Each row MUST provide action buttons: Editar (pencil), Ver (eye), Eliminar (trash with confirmation).

#### Scenario: Row actions render for each indicator

- GIVEN the table has rows
- WHEN a row renders
- THEN Editar, Ver, and Eliminar buttons SHALL be visible
- AND clicking Editar SHALL navigate to the indicator editor page
- AND clicking Ver SHALL navigate to the indicator view page

#### Scenario: Delete action shows confirmation

- GIVEN the user clicks the Eliminar button
- WHEN the button is clicked
- THEN a confirmation modal SHALL appear before deletion executes

### Requirement: Search and Filter

The system MUST provide a text search/filter input that filters the indicator table by text matching any visible column.

#### Scenario: Search filters results

- GIVEN the indicator table has multiple rows
- WHEN the user types text in the search input
- THEN the table SHALL filter to show only rows where any column matches the search text
- AND the filter SHALL be case-insensitive

#### Scenario: Search with no matches

- GIVEN the indicator table has rows
- WHEN the user types text that matches no indicator
- THEN the table SHALL show an empty state message "No se encontraron indicadores"

### Requirement: Export to Clipboard

The system MUST provide a button to copy the indicator table to the clipboard.

#### Scenario: Copy table to clipboard

- GIVEN the indicator table is loaded
- WHEN the user clicks the clipboard export button
- THEN the table data SHALL be copied to the system clipboard in tab-separated format
- AND a success toast SHALL appear

### Requirement: Export to Excel

The system MUST provide a button to download the indicator table as an .xlsx file.

#### Scenario: Download Excel file

- GIVEN the indicator table is loaded
- WHEN the user clicks the Excel export button
- THEN a .xlsx file SHALL be downloaded containing the table data
- AND a success toast SHALL appear

### Requirement: Export to PDF

The system MUST provide a button to download the indicator table as a PDF document.

#### Scenario: Download PDF file

- GIVEN the indicator table is loaded
- WHEN the user clicks the PDF export button
- THEN a PDF document SHALL be downloaded containing the table data
- AND a success toast SHALL appear

### Requirement: Loading Skeleton

The system MUST show a loading skeleton state while the indicator data is being fetched.

#### Scenario: Skeleton shows during loading

- GIVEN the indicator page is loading
- WHEN the data is being fetched
- THEN a skeleton placeholder SHALL be displayed matching the table structure
- AND the skeleton SHALL have animated shimmer effect
