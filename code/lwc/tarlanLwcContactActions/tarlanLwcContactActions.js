import { LightningElement, api, wire } from "lwc";

// Will be used to fetch a contact record's fields directly from Salesforce
import { getRecord } from "lightning/uiRecordApi";

// Import necessary modules for Lightning components like popups, toasts and confirmations
import LightningConfirm from "lightning/confirm";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

// Import necessary modules for user data
import userId from "@salesforce/user/Id";
import userNameField from "@salesforce/schema/User.Name";

// Import Apex handler methods that will be used in the component
import acceptApplicationApex from "@salesforce/apex/TarlanLwcContactHandler.acceptApplication";
import rejectApplicationApex from "@salesforce/apex/TarlanLwcContactHandler.rejectApplication";
import promoteToUpperLevelApex from "@salesforce/apex/TarlanLwcContactHandler.promoteContributorToUpperLevel";
import removeContributorApex from "@salesforce/apex/TarlanLwcContactHandler.removeContributor";

// Fields that will be used in the component
const CONTACT_FIELDS = [
	"Contact.Id",
	"Contact.Name",
	"Contact.Contributor_Level__c",
	"Contact.Approval_Status__c",
	"Contact.Community_Role__c"
];

export default class tarlanLwcContactActions extends LightningElement {
	@api recordId;
	// Enabling all buttons for sandbox, this must be set using permission in the prod org
	_isCardVisible = true;
	_isAcceptApplicationButtonVisible = true;
	_isAcceptApplicationButtonEnabled = true;
	_isRejectApplicationButtonVisible = true;
	_isRejectApplicationButtonEnabled = true;
	_isPromoteToUpperLevelButtonVisible = true;
	_isPromoteToUpperLevelButtonEnabled = true;
	_isRemoveButtonVisible = true;
	_isRemoveButtonEnabled = true;
	currentUserFullname;
	contactData;

	//#region Class properties

	@api
	get isCardVisible() {
		return this._isCardVisible;
	}

	@api
	get isAcceptApplicationButtonVisible() {
		return this._isAcceptApplicationButtonVisible;
	}

	@api
	get isAcceptApplicationButtonDisabled() {
		return !this._isAcceptApplicationButtonEnabled;
	}

	@api
	get isRejectApplicationButtonVisible() {
		return this._isRejectApplicationButtonVisible;
	}

	@api
	get isRejectApplicationButtonDisabled() {
		return !this._isRejectApplicationButtonEnabled;
	}

	@api
	get isPromoteToUpperLevelButtonVisible() {
		return this._isPromoteToUpperLevelButtonVisible;
	}

	@api
	get isPromoteToUpperLevelButtonDisabled() {
		return !this._isPromoteToUpperLevelButtonEnabled;
	}

	@api
	get isRemoveButtonVisible() {
		return this._isRemoveButtonVisible;
	}

	@api
	get isRemoveButtonDisabled() {
		return !this._isRemoveButtonEnabled;
	}

	//#endregion

	// Fetch current user data
	@wire(getRecord, { recordId: userId, fields: [userNameField] })
	wiredUser({ data, error }) {
		if (data) {
			this.currentUserFullname = data.fields.Name.value;
			console.log(`Current salesforce user: ${this.currentUserFullname}`);
		} else if (error) {
			console.error("Error fetching user data:", error);
		}
	}

	// Fetch contact data
	@wire(getRecord, { recordId: '$recordId', fields: CONTACT_FIELDS })
	wiredContact({ data, error }) {
		if (data) {
			this.contactData = data.fields;
			this.updateAcceptApplicationButtonState();
			this.updateRejectApplicationButtonState();
			this.updatePromoteToUpperLevelButtonState();
			this.updateRemoveButtonState();
			console.log("Contact data fetched successfully:", this.contactData);
		} else if (error) {
			console.error("Error fetching contact data:", error);
		}
	}


	// Update Accept Application button's enabled/disabled state based on contact conditions
	updateAcceptApplicationButtonState() {
		if (this.contactData) {
			this._isAcceptApplicationButtonEnabled =
				this.contactData.Approval_Status__c.value === "Pending";
		}
	}

	// Update Reject Application button's enabled/disabled state based on contact conditions
	updateRejectApplicationButtonState() {
		if (this.contactData) {
			this._isRejectApplicationButtonEnabled =
				this.contactData.Approval_Status__c.value === "Pending";
		}
	}

	// Update Promote to Upper Level button's enabled/disabled state based on contact conditions
	updatePromoteToUpperLevelButtonState() {
		if (this.contactData) {
			const validApprovalStatuses = ["Accepted"];
			const validTiers = ["Contributor", "Senior Contributor"];

			this._isPromoteToUpperLevelButtonEnabled =
				this.contactData.Approval_Status__c.value !== null &&
				this.contactData.Contributor_Level__c.value !== null &&
				validApprovalStatuses.includes(this.contactData.Approval_Status__c.value) &&
				validTiers.includes(this.contactData.Contributor_Level__c.value);
		}
	}

	// Update Remove button's enabled/disabled state based on contact conditions
	updateRemoveButtonState() {
		if (this.contactData) {
			const validApprovalStatuses = ["Accepted"];
			const validTiers = [
				"Contributor",
				"Senior Contributor",
				"Premium Contributor"
			];

			this._isRemoveButtonEnabled =
				this.contactData.Approval_Status__c.value !== null &&
				this.contactData.Contributor_Level__c.value !== null &&
				validApprovalStatuses.includes(this.contactData.Approval_Status__c.value) &&
				validTiers.includes(this.contactData.Contributor_Level__c.value);
		}
	}


	// Accept contact on button click
	async acceptApplicationHandler() {
		console.log("Accept Application handler is initiated ...");

		// Show a confirmation dialog before proceeding
		const confirmed = await LightningConfirm.open({
			message: `By proceeding, the contributor will be set to 'Accepted' status and will gain access to all necessary contributor portal permissions.
            Please note, the contributor will also receive a notification email at this point. Are you certain you want to move forward with this action?`,
			variant: "header",
			label: "Confirmation",
			theme: "warning"
		});

		if (confirmed) {
			try {
				// Call the Apex method to accept the contact
				await acceptApplicationApex({ contactId: this.recordId });

				console.log("Accepted application successfully.");

				// Refresh the page to reflect the changes
				window.location.reload();
			} catch (error) {
				console.error("Error accepting application:", error);

				// Show an error toast message
				const evt = new ShowToastEvent({
					title: "Failed to accept application",
					message: "Please contact to administrator.",
					variant: "error"
				});
				this.dispatchEvent(evt);
			}
		} else {
			console.log("Accepted Application is canceled by user.");
		}
	}

	// Reject contact on button click
	async rejectApplicationHandler() {
		console.log("Reject Application handler is initiated ...");

		const confirmed = await LightningConfirm.open({
			message: `By proceeding, the contributor will be set to 'Rejected' status. Please note, the contributor will also receive a notification email at this point. Are you certain you want to move forward with this action?`,
			variant: "header",
			label: "Confirmation",
			theme: "warning"
		});

		if (confirmed) {
			try {
				// Call the Apex method to reject the contact
				await rejectApplicationApex({ contactId: this.recordId });

				console.log("Rejected application successfully.");

				// Refresh the page to reflect the changes
				window.location.reload();
			} catch (error) {
				console.error("Error rejecting application:", error);

				// Show an error toast message
				const evt = new ShowToastEvent({
					title: "Failed to reject application",
					message: "Please contact to administrator.",
					variant: "error"
				});
				this.dispatchEvent(evt);
			}
		} else {
			console.log("Reject Application is canceled by user.");
		}
	}

	// Promote contact on button click
	async promoteToUpperLevelHandler() {
		console.log("Promote to upper level handler is initiated ...");

		// Show a confirmation dialog before proceeding
		const confirmed = await LightningConfirm.open({
			message: `By proceeding, the contributor will be promoted to Premium level. Are you certain you want to move forward with this action?`,
			variant: "header",
			label: "Confirmation",
			theme: "warning"
		});

		if (confirmed) {
			try {
				// Call the Apex method to promote the contact
				await promoteToUpperLevelApex({ contactId: this.recordId });

				console.log("Contact has been Promoted to premium level successfully.");

				// Refresh the page to reflect the changes
				window.location.reload();
			} catch (error) {
				console.error("Error promoting to upper level:", error);

				// Show an error toast message
				const evt = new ShowToastEvent({
					title: "Failed to promote to upper level",
					message: "Please contact to administrator.",
					variant: "error"
				});
				this.dispatchEvent(evt);
			}
		} else {
			console.log("Promote operation is canceled by user.");
		}
	}

	// Remove contact on button click
	async removeHandler() {
		console.log("Remove contact handler is initiated ...");


		const confirmed = await LightningConfirm.open({
			message: `By proceeding, the contributor will be removed from the Network. Please note, the contributor will NOT receive a notification email at this point. Are you certain you want to move forward with this action?`,
			variant: "header",
			label: "Confirmation",
			theme: "warning"
		});

		if (confirmed) {
			try {
				// Call the Apex method to remove the contact
				await removeContributorApex({ contactId: this.recordId });

				console.log("Contact has been removed successfully.");

				// Refresh the page to reflect the changes
				window.location.reload();
			} catch (error) {
				console.error("Error removing contact:", error);

				// Show an error toast message
				const evt = new ShowToastEvent({
					title: "Failed to remove contact",
					message: "Please contact to administrator.",
					variant: "error"
				});
				this.dispatchEvent(evt);
			}
		} else {
			console.log("Remove contact operation is canceled by user.");
		}
	}
}