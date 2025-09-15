# Simple Salesforce Configuration Metadata for Community & LMS Platform Management

## Contact Object Custom Fields

### 1. `Approval Status` Field

This field tracks the user's lifecycle and access state within the community portal.

- Field Label: `Approval Status`
- Field API Name: `Approval_Status__c`
- Data Type: `Picklist`
- Description: Controls the user's provisioning status for the community and LMS platform.
- Picklist options:
    - 'Pending': The user has applied for access but is awaiting administrator review. Default option.
    - 'Accepted': The administrator has approved the user; they are provisioned and can access the community.
    - 'Rejected': The administrator has rejected the user's application for access.
    - 'Removed': The user was previously accepted but has been deactivated and removed from the community.


### 2. `Contributor Level` Field

This field represents the user's subscription or feature tier. It dictates what features and data they can access across multiple platforms (e.g., Community, LMS).

- Field Label: `Contributor Level`
- Field API Name: `Contributor_Level__c`
- Data Type: `Picklist`
- Description: Defines the user's access package and permission tier within our ecosystems.
- Picklist options:
    - 'Applicant': A default value for new contacts who haven't been assigned a level yet. Synonymous with a "Pending" approval status. Default option.
    - 'Contributor': Basic access level. Grants entry to the community with core, read-only features.
    - 'Senior Contributor': Elevated access level. Can create content, participate in discussions, and submit support cases.
    - 'Premium Contributor': Highest access level. Grants access to premium content, advanced tools, and dedicated support channels.


### 3. `Community Role` Field

This field defines the user's functional role and is directly used to assign their security permissions within the LMS platform.

- Field Label: `Community Role`
- Field API Name: `Community_Role__c`
- Data Type: `Picklist`
- Description: Determines the user's functional title and security permissions in the LMS platform. This value is mapped to specific LMS security roles during user provisioning.
- Picklist options:
    - 'No Access': The user exists in Salesforce but has no login rights or access to the LMS platform. Default option.
    - 'Community Candidate': The functional role for an Applicant. They are a candidate for membership but have not yet been granted access.
    - 'Community Member': The functional role for a Community regular member. They are a participating member with basic, read-only access in the LMS.
    - 'Community Senior': The functional role for a Community Senior. This role can create content, collaborate with others, and has elevated permissions in the LMS.
    - 'Community Lead': The functional role for a Community Lead user. This role has the highest level of influence and access within the LMS community.


### Field Relationships & Business Logic

The values across these three fields are designed to work in concert. The following matrix illustrates the intended correlations:

| Approval Status | Contributor Level                        | Community Role                          | Description                                                     |
| :-------------- | :--------------------------------------- | :-------------------------------------- | :-------------------------------------------------------------- |
| Pending         | Applicant                                | Candidate                               | New sign-up awaiting approval. No system access.                |
| Rejected        | *NULL-                                   | No Access                               | Application was rejected. LMS access is revoked.                |
| Removed         | *NULL-                                   | No Access                               | User was deactivated. LMS access is revoked.                    |
| Accepted        | Contributor                              | Community Member                        | Active user with basic, read-only access in the LMS.            |
| Accepted        | Senior Contributor                       | Community Senior                        | Active user with content creation and collaboration privileges. |
| Accepted        | Premium Contributor                      | Community Lead                          | Active user with the highest level of access and influence.     |


## Use Case Scenarios

### Use Case 1: New User Registration and Approval

Actor: Salesforce backend user, New User (Applicant)
Description: A new user signs up for the community portal and awaits administrative approval.

1.  Pre-condition: A new user fills out Community self-registration page, which creates a new Contact record in Salesforce.
2.  Trigger: A new Contact record is created.
3.  Basic Flow:
    1.  Upon creation, the system's default values are applied:
        - `Approval_Status__c` is set to 'Pending'.
        - `Contributor_Level__c` is set to 'Applicant'.
        - `Community_Role__c` is set to 'Candidate'.
    2.  This record will end up in Contact List view named 'Pending applications'.
    3.  The Salesforce backend user reviews the application details in the Contact record.
    4.  The Salesforce backend user approves the application by changing the `Approval_Status__c` from 'Pending' to 'Accepted'.
4.  Post-condition: The user is now active. Based on the business logic, an automation (like a Flow) is triggered. Since the status is 'Accepted' and the level is 'Applicant', the Flow automatically updates the `Contributor_Level__c` to the default access level, 'Contributor'. Consequently, the `Community_Role__c` is also updated to 'Community Member'.
5.  Result: The user is provisioned in the LMS with the security permissions of a 'Community Member' (basic, read-only access). A welcome email is automatically sent to the user with login credentials.


### Use Case 2: Salesforce backend user Manually Upgrading a User

Actor: Salesforce backend user
Description: An Salesforce backend user rewards an active member by upgrading their access tier.

1.  Pre-condition: A Contact record exists with:
    - `Approval_Status__c` = 'Accepted'
    - `Contributor_Level__c` = 'Contributor'
    - `Community_Role__c` = 'Community Member'
2.  Trigger: The Salesforce backend user identifies a user who has been highly active and valuable to the community and decides to grant them elevated privileges.
3.  Basic Flow:
    1.  The Salesforce backend user navigates to the user's Contact record.
    2.  They manually update the `Contributor_Level__c` field from 'Contributor' to 'Senior Contributor'.
4.  Post-condition: An automation (Flow) is triggered by the change to the `Contributor_Level__c` field. The Flow checks the `Approval_Status__c` is 'Accepted' and, based on the defined matrix, updates the `Community_Role__c` field to 'Community Senior'.
5.  Result: The user's permissions in the LMS are automatically updated to reflect the 'Community Senior' role. They can now create content, collaborate with others, and access elevated features. The user receives a notification about their new status.


### Use Case 3: Rejecting an Application

Actor: Salesforce backend user
Description: An Salesforce backend user reviews and rejects a fraudulent or incomplete application.

1.  Pre-condition: A Contact record exists with `Approval_Status__c` = 'Pending'.
2.  Trigger: The Salesforce backend user reviews the application and finds it does not meet the community's criteria.
3.  Basic Flow:
    1.  The Salesforce backend user changes the `Approval_Status__c` from 'Pending' to 'Rejected'.
4.  Post-condition: An automation (Flow) is triggered by the status change to 'Rejected'. The Flow performs the following actions:
    - Sets the `Contributor_Level__c` field to *blank* (*NULL*).
    - Sets the `Community_Role__c` field to 'No Access'.
    - Deactivates the user's community login (if it was provisioned).
5.  Result: The user is completely removed from system access. Their functional role is 'No Access', ensuring they have no permissions in the LMS. A rejection email is sent to the applicant.


### Use Case 4: Removing an Existing User for Violations (Sanctioned users)

Actor: Salesforce backend user
Description: An Salesforce backend user must deactivate a currently active user for violating community guidelines.

1.  Pre-condition: A Contact record exists for an active user:
    - `Approval_Status__c` = 'Accepted'
    - `Contributor_Level__c` = 'Senior Contributor'
    - `Community_Role__c` = 'Community Senior'
2.  Trigger: The user is reported for abusive behavior.
3.  Basic Flow:
    1.  The Salesforce backend user changes the `Approval_Status__c` from 'Accepted' to 'Removed'.
4.  Post-condition: An automation (Flow) is triggered by the status change to 'Removed'. The Flow performs the following actions:
    - Sets the `Contributor_Level__c` field to *blank* (*NULL*).
    - Sets the `Community_Role__c` field to 'No Access'.
    - Immediately revokes the user's login credentials and active sessions for the community and LMS.
5.  Result: The user is instantly deactivated and loses all access. The record is kept for reporting purposes, clearly showing a status of 'Removed' and a role of 'No Access'.


### Use Case 5: Directly Assigning a Premium Role

Actor: Salesforce backend user
Description: An executive from a partner company needs to be given the highest level of access immediately upon signing up.

1.  Pre-condition: The Salesforce backend user creates a new Contact record manually for a VIP user.
2.  Trigger: The need to create a high-level user without going through the standard pending process.
3.  Basic Flow:
    1.  The Salesforce backend user creates the Contact and does not leave the defaults.
    2.  They immediately set the three fields according to the business matrix:
        - `Approval_Status__c` = 'Accepted'
        - `Contributor_Level__c` = 'Premium Contributor'
        - `Community_Role__c` = 'Community Lead'
4.  Post-condition: An automation (Flow) sees that the status is 'Accepted' and the role/level are in sync according to the matrix. No further changes are needed.
5.  Result: The user is provisioned with the 'Community Lead' security role in the LMS, granting them access to premium content, advanced tools, and dedicated support from the moment their account is activated.




## Validation Rules

### Validation Rule 1: Enforce Matrix Compliance on Accepted Users

This rule ensures that when a user is `Accepted`, the `Contributor Level` and `Community Role` have one of the three valid combinations from your matrix.

Name: `VR_Contact_Valid_Accepted_Combination`
Error Condition Formula:
```java
/* Check if the custom setting is enabled FIRST */
tarlan_custom_settings__c.getInstance().Enable_Validation_Rules__c
&&
/* Then, check the original data condition */
AND(
  ISPICKVAL(Approval_Status__c, "Accepted"),
  NOT(
    OR(
      /* Valid Combination 1: Contributor & Community Member */
      AND(
        ISPICKVAL(Contributor_Level__c, "Contributor"),
        ISPICKVAL(Community_Role__c, "Community Member")
      ),
      /* Valid Combination 2: Senior Contributor & Community Senior */
      AND(
        ISPICKVAL(Contributor_Level__c, "Senior Contributor"),
        ISPICKVAL(Community_Role__c, "Community Senior")
      ),
      /* Valid Combination 3: Premium Contributor & Community Lead */
      AND(
        ISPICKVAL(Contributor_Level__c, "Premium Contributor"),
        ISPICKVAL(Community_Role__c, "Community Lead")
      )
    )
  )
)
```
Error Message: `For an Accepted user, the Contributor Level and Community Role must be a valid combination. Please check the business logic matrix. Accepted combinations are: Contributor/Member, Senior Contributor/Senior, Premium Contributor/Lead.`
Error Location: `Community_Role__c`


### Validation Rule 2: Enforce Clearance for Rejected/Removed Users

This rule ensures that if a user is `Rejected` or `Removed`, their `Contributor Level` is cleared and their `Community Role` is set to `No Access`.

Name: `VR_Contact_Clearance_On_Reject_Remove`
Error Condition Formula:
```java
/* Check if the custom setting is enabled FIRST */
$Setup.tarlan_custom_settings__c.Enable_Validation_Rules__c
&&
/* Then, check the original data condition */
OR(
  AND(
    ISPICKVAL(Approval_Status__c, "Rejected"),
    OR(
      NOT(ISBLANK(TEXT(Contributor_Level__c))),
      NOT(ISPICKVAL(Community_Role__c, "No Access"))
    )
  ),
  AND(
    ISPICKVAL(Approval_Status__c, "Removed"),
    OR(
      NOT(ISBLANK(TEXT(Contributor_Level__c))),
      NOT(ISPICKVAL(Community_Role__c, "No Access"))
    )
  )
)
```
Error Message: `If the Approval Status is set to Rejected or Removed, the Contributor Level must be cleared and the Community Role must be set to 'No Access'.`
Error Location: `Approval_Status__c`


### Validation Rule 3: Prevent Invalid Role/Level for Pending Users

This rule ensures that a `Pending` user can only have the `Applicant` contributor level and the `Candidate` community role. This prevents someone from being given a high role before they are even accepted.

Name: `VR_Contact_Valid_Pending_Combination`
Error Condition Formula:
```java
/* Check if the custom setting is enabled FIRST */
$Setup.tarlan_custom_settings__c.Enable_Validation_Rules__c
&&
/* Then, check the original data condition */
AND(
  ISPICKVAL(Approval_Status__c, "Pending"),
  NOT(
    AND(
      ISPICKVAL(Contributor_Level__c, "Applicant"),
      ISPICKVAL(Community_Role__c, "Community Candidate")
    )
  )
)
```
Error Message: `A user with a Pending status must have a Contributor Level of 'Applicant' and a Community Role of 'Candidate'.`
Error Location: `Approval_Status__c`


### Validation Rule 4: Prevent Setting Accepted with Invalid Data

This rule prevents a user from being saved with an `Accepted` status if they don't have a valid `Contributor Level` and `Community Role` already set. This is a crucial backstop.

Name: `VR_Contact_Cannot_Accept_Without_Valid_Combo`
Error Condition Formula:
```java
/* Check if the custom setting is enabled FIRST */
$Setup.tarlan_custom_settings__c.Enable_Validation_Rules__c
&&
/* Then, check the original data condition */
AND(
  ISPICKVAL(Approval_Status__c, "Accepted"),
  OR(
    ISPICKVAL(Contributor_Level__c, "Applicant"), /* Can't be accepted as just an applicant */
    ISBLANK(TEXT(Contributor_Level__c)), /* Level must be set */
    ISPICKVAL(Community_Role__c, "Candidate"), /* Can't be accepted as just a candidate */
    ISPICKVAL(Community_Role__c, "No Access") /* Can't be accepted with no access */
  )
)
```
Error Message: `You cannot set the Approval Status to 'Accepted' without first assigning a valid Contributor Level (Contributor, Senior, or Premium) and corresponding Community Role. An 'Applicant' cannot be directly accepted.`
Error Location: `Approval_Status__c`


## LWC Button Suite: Contact Application Management

The purpose, logic, and user experience for three custom Lightning Web Component (LWC) buttons designed to streamline user management on the Contact record page.

### Overview

The buttons `Accept Application`, `Reject Application`, `Remove Contributor` and `Promote Contributor` provide administrators with one-click actions to manage a user's community and LMS access. They enforce business logic by automatically setting the `Approval Status`, `Contributor Level`, and `Community Role` fields correctly, ensuring data integrity and simplifying the administrative workflow.

### 1. `Accept Application` button

- API Name: `Accept_Application`
- Label: `Accept Application`
- Purpose: To approve a pending user's application, granting them access to the community with a default access level.

Pre-Conditions (When the button is visible/active):
- The Contact's `Approval_Status__c` must be 'Pending'.

Action Logic:
Upon click, the button executes the following field updates:
- `Approval_Status__c` = 'Accepted'
- `Contributor_Level__c` = 'Contributor' (The default starting tier for new members)
- `Community_Role__c` = 'Community Member' (The functional role mapped to the Contributor level)

Post-Conditions & Result:
1.  The Contact record is saved with the new values.
2.  An automation (e.g., Flow) is triggered by the field changes to provision the user in the community and LMS platform with 'Community Member' permissions.
3.  A success toast notification confirms the action: *"Application accepted. User has been granted Community Member access."*


### 2. `Reject Application` button

- API Name: `Reject_Application`
- Label: `Reject Application`
- Purpose: To deny a pending user's application, preventing any system access.

Pre-Conditions (When the button is visible/active):
- The Contact's `Approval_Status__c` must be 'Pending'.

Action Logic:
Upon click, the button executes the following field updates:
- `Approval_Status__c` = 'Rejected'
- `Contributor_Level__c` = *` cleared to null `*
- `Community_Role__c` = 'No Access'

Post-Conditions & Result:
1.  The Contact record is saved with the new values.
2.  Any automation (e.g., Flow) listening for a 'Rejected' status will ensure the user is deprovisioned and has no login rights.
3.  A success toast notification confirms the action: *"Application rejected. User has been denied access."*


### 3. `Remove Contributor` button

- API Name: `Remove_Contributor`
- Label: `Remove Contributor`
- Purpose: To deactivate a currently active community member, revoking their existing access immediately.

Pre-Conditions (When the button is visible/active):
- The Contact's `Approval_Status__c` must be 'Accepted'.

Action Logic:
Upon click, the button executes the following field updates:
- `Approval_Status__c` = 'Removed'
- `Contributor_Level__c` = *` cleared to null `*
- `Community_Role__c` = 'No Access'

Post-Conditions & Result:
1.  The Contact record is saved with the new values.
2.  An automation (e.g., Flow) is triggered by the 'Removed' status to immediately revoke the user's login credentials and active sessions in the community and LMS.
3.  A success toast notification confirms the action: *"Contributor removed. All system access has been revoked."*


### 4.`Promote Contributor` button

API Name: `Promote_Contributor`
Label: `Promote Contributor`
Purpose: To elevate an already accepted user to a higher access tier (Contributor Level), automatically setting the corresponding Community Role.

Pre-Conditions (When the button is visible/active):
- The Contact's `Approval_Status__c` must be 'Accepted'.
- The Contact's current `Contributor_Level__c` is not 'Premium Contributor' (as this is the highest level).

Action Logic:
1.  Upon click, the button opens a modal dialog.
2.  The modal presents the administrator with a picklist of available levels to promote the user to. The options are based on the `Contributor_Level__c` picklist values, excluding the current level and any lower levels (e.g., if the user is a 'Contributor', the options are 'Senior Contributor' and 'Premium Contributor').
3.  The administrator selects the desired new level and clicks "Confirm".
4.  The LWC then executes the following field updates based on the selection:
    - `Contributor_Level__c` = `[Selected Value]`
    - `Community_Role__c` is automatically set based on the business logic matrix:
        - If `'Senior Contributor'` is selected, set role to 'Community Senior'.
        - If `'Premium Contributor'` is selected, set role to 'Community Lead'.

Post-Conditions & Result:
1.  The Contact record is saved with the new values.
2.  An automation (e.g., Flow) is triggered by the field changes to update the user's permissions in the LMS platform to match their new role.
3.  A success toast notification confirms the action: *"Contributor promoted to [Selected Level]. Their access permissions have been updated."*

Cancellation: The modal includes a "Cancel" button, which closes the dialog without making any changes to the record.


### Implementation & User Experience Notes

- Visibility: The buttons should be placed on the Contact Lightning Record Page and their visibility controlled by the `Approval_Status__c` and `Contributor_Level__c` fields using conditional visibility rules.
    - 'Accept' and 'Reject' are visible only when `Approval_Status__c` equals 'Pending'.
    - 'Remove' and 'Promote' are visible only when `Approval_Status__c` equals 'Accepted'.
    - 'Promote' is further hidden if `Contributor_Level__c` equals 'Premium Contributor'.
- Confirmation: For the 'Reject', 'Remove', and 'Promote' actions, a modal dialog is used to prevent accidental execution (confirmation for Reject/Remove, selection for Promote).
- Error Handling: The LWC should include error handling to catch and display any DML exceptions (e.g., validation rule failures) in a user-friendly manner.







