// This will suppress all the ApexCRUDViolation PMD warnings in this class
@SuppressWarnings('PMD.ApexCRUDViolation')
public with sharing class TarlanLwcContactHandler {

    //#region Helper methods

    private static void sendEmail(String emailContent, String emailBody, String emailAddress) {
        Logger.info('Sending email...');

        // Send email logic here

        Logger.info('Email has been sent successfully.');
    }

    private static Contact getContactRecord(Id contactId) {
        Logger.info('Searching for contact record with Id: ' + contactId);

        // Search for the contact record
        Contact con = [
            SELECT
                Id,
                Name,
                Email,
                Approval_Status__c,
                Contributor_Level__c,
                Community_Role__c
            FROM Contact
            WHERE Id = :contactId
        ];

        // Check if the contact record was found
        if (con == null) {
            Logger.error('Contact with given Id has not been found.');
            throw new AuraHandledException('Contact with given Id has not been found.');
        }

        Logger.info('Contact record found.');
        return con;
    }

    private static void validateAcceptedApplication(Contact con) {
        Logger.info('Validating contact record ...');

        // Check if the contact satisfies the criteria to be Accepted
        Boolean isValid = con.Approval_Status__c == 'Pending';

        if (!isValid) {
            Logger.error('Contact record does not meet criteria to proceed forward.');
            throw new AuraHandledException('Contact record does not meet criteria to proceed forward.');
        }
    }

    private static void validateRejectedApplication(Contact con) {
        Logger.info('Validating contact record ...');

        // Check if the contact satisfies the criteria to be rejected
        Boolean isValid = con.Approval_Status__c == 'Pending';

        if (!isValid) {
            Logger.error('Contact record does not meet criteria to proceed forward.');
            throw new AuraHandledException('Contact record does not meet criteria to proceed forward.');
        }
    }

    private static void validatePromotableContact(Contact con) {
        Logger.info('Validating contact record ...');

        // Check if the contact satisfies the criteria to be promoted to Principal Level
        List<String> validApprovalStatuses = new List<String>{
            'Pending',
            'Accepted'
        };
        List<String> validLevels = new List<String>{
            'Applicant',
            'Contributor',
            'Senior Contributor'
        };

        Boolean isValid =
            con.Approval_Status__c != null &&
            con.Contributor_Level__c != null &&
            validApprovalStatuses.contains(con.Approval_Status__c) &&
            validLevels.contains(con.Contributor_Level__c);

        if (!isValid) {
            Logger.error('Contact record does not meet criteria to proceed forward.');
            throw new AuraHandledException('Contact record does not meet criteria to proceed forward.');
        }
    }

    private static void validateRemovedContact(Contact con) {
        Logger.info('Validating contact record ...');

        // Check if the contact satisfies the criteria to be removed
        List<String> validApprovalStatuses = new List<String>{ 'Accepted' };
        List<String> validLevels = new List<String>{'Contributor', 'Senior Contributor', 'Premium Contributor'};

        Boolean isValid =
            con.Approval_Status__c != null &&
            con.Contributor_Level__c != null &&
            validApprovalStatuses.contains(con.Approval_Status__c) &&
            validLevels.contains(con.Contributor_Level__c);

        if (!isValid) {
            Logger.error('Contact record does not meet criteria to proceed forward.');
            throw new AuraHandledException('Contact record does not meet criteria to proceed forward.');
        }
    }

    private static void updateAcceptedApplication(Contact con) {
        Logger.info('Updating contact record ...');

        // Set contact fields and update
        con.Approval_Status__c = 'Accepted';
		con.Contributor_Level__c = 'Contributor';
		con.Community_Role__c = 'Community Member';

        // Update the contact
        update con;

        Logger.info('Contact has been updated successfully.');
    }

    private static void updateRejectedApplication(Contact con) {
        Logger.info('Updating contact record ...');

        // Set contact fields and update
        con.Approval_Status__c = 'Rejected';
		con.Contributor_Level__c = '';
        con.Community_Role__c = 'No Access';

        // Update the contact
        update con;

        Logger.info('Contact has been updated successfully.');
    }

    private static void updatePromotedContact(Contact con) {
        Logger.info('Updating contact record ...');

        // Promote the contact to upper level
        con.Contributor_Level__c = 'Premium Contributor';
        con.Community_Role__c = 'Community Lead';

        // Update the contact
        update con;

        Logger.info('Contact has been updated successfully.');
    }

    private static void removeContact(Contact con) {
        Logger.info('Updating contact record ...');

        con.Approval_Status__c = 'Removed';
        con.Contributor_Level__c = '';
        con.Community_Role__c = 'No Access';

        // Update the contact
        update con;

        Logger.info('Contact has been updated successfully.');
    }

    /**
     * Maps Contributor Level values to corresponding Community Role values
     *
     * @param contributorLevel The contributor level value
     * @return String The corresponding community role value
     */
    private static String getLevelBasedRole(String contributorLevel) {
        if (String.isBlank(contributorLevel)) {
            return null;
        }

        switch on contributorLevel {
            when 'Contributor' {
                return 'Community Member';
            }
            when 'Senior Contributor' {
                return 'Community Senior';
            }
            when 'Premium Contributor' {
                return 'Community Premium';
            }
            when else {
                Logger.warn('Unknown contributor level: ' + contributorLevel);
                return null;
            }
        }
    }

    //#endregion

    //#region Custom LWC Button action handler methods

    /**
     * Handles the action triggered by the `Accept Application` LWC button.
     * @param contactId The Id of the contact application to be Acceptd.
     */
    @AuraEnabled
    public static void acceptApplication(Id contactId) {
        Logger.info('Trying to Accept application ...');

        if (contactId == null) {
            throw new AuraHandledException('Contact ID cannot be null');
        }

        try {
            // Get contact
            Contact con = getContactRecord(contactId);

            // Validate contact
            validateAcceptedApplication(con);

            // Update contact
            updateAcceptedApplication(con);

            Logger.info('Application has been Accepted successfully.');
        } catch (Exception ex) {
            Logger.error('An error occurred: ' + ex.getMessage());
            throw new AuraHandledException('An error occurred: ' + ex.getMessage());
        } finally {
            Logger.saveLog();
        }
    }

    /**
     * Handles the action triggered by the `Reject Application` LWC button.
     * @param contactId The Id of the contact application to be rejected.
     */
    @AuraEnabled
    public static void rejectApplication(Id contactId) {
        Logger.info('Trying to reject application ...');

        if (contactId == null) {
            throw new AuraHandledException('Contact ID cannot be null');
        }

        try {
            // Get contact
            Contact con = getContactRecord(contactId);

            // Validate contact
            validateRejectedApplication(con);

            // Update contact
            updateRejectedApplication(con);

            Logger.info('Application has been rejected successfully.');
        } catch (Exception ex) {
            Logger.error('An error occurred: ' + ex.getMessage());
            throw new AuraHandledException('An error occurred: ' + ex.getMessage());
        } finally {
            Logger.saveLog();
        }
    }

    /**
     * Handles the action triggered by the `Promote Contributor` LWC button.
     * @param contactId The Id of the contact to be promoted.
     */
    @AuraEnabled
    public static void promoteContributorToUpperLevel(Id contactId) {
        Logger.info('Trying to promote contact to upper level ...');

        if (contactId == null) {
            throw new AuraHandledException('Contact ID cannot be null');
        }

        try {
            // Get contact
            Contact con = getContactRecord(contactId);

            // Validate contact
            validatePromotableContact(con);

            // Update contact
            updatePromotedContact(con);

            Logger.info('Contact has been promoted to upper level successfully.');
        } catch (Exception ex) {
            Logger.error('An error occurred: ' + ex.getMessage());
            throw new AuraHandledException('An error occurred: ' + ex.getMessage());
        } finally {
            Logger.saveLog();
        }
    }

    /**
     * Handles the action triggered by the `Remove Contributor` LWC button.
     * @param contactId The Id of the contact to be removed.
     */
    @AuraEnabled
    public static void removeContributor(Id contactId) {
        Logger.info('Trying to remove contributor ...');

        if (contactId == null) {
            throw new AuraHandledException('Contact ID cannot be null');
        }

        try {
            // Get contact
            Contact con = getContactRecord(contactId);

            // Validate contact
            validateRemovedContact(con);

            // Update contact
            removeContact(con);

            Logger.info('Contributor has been removed successfully.');
        } catch (Exception ex) {
            Logger.error('An error occurred: ' + ex.getMessage());
            throw new AuraHandledException('An error occurred: ' + ex.getMessage());
        } finally {
            Logger.saveLog();
        }
    }

    //#endregion
}