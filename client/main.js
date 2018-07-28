import {Template} from 'meteor/templating';
import {CheckStatus} from "../lib/collections";
import {Accounts} from 'meteor/accounts-base';
import './main.html';
import {Meteor} from "meteor/meteor";

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
});


Template.main.onCreated(function mainOnCreated() {
    Meteor.subscribe('checkStatuses');
});

Template.main.helpers({
    checkStatuses() {
        return CheckStatus.find({}, {sort: {createdAt: -1}});
    },
    ownerStatuses() {
        return CheckStatus.find({owner: Meteor.userId()}, {sort: {createdAt: -1}});
    }

});

Template.currentStatus.helpers({
    getCurrentStatus() {
        const last = CheckStatus.findOne({owner: Meteor.userId()}, {fields: {_id: 1, text: 1}, sort: {createdAt: -1}, limit: 1});
        if (last !== undefined) {
            Meteor.call('checkStatuses.setPublic', last._id, false);
            // console.log(last);
            return last.text;
        }
    }
});

function insert(status) {
    let text = "In";
    if (status === "Out") {
        text = "Out";
    }
    const time = moment().format("YYYY-MM-DD HH:mm:ss");
    let last = CheckStatus.findOne({owner: Meteor.userId()}, {fields: {_id: 1}, sort: {createdAt: -1}, limit: 1});
    if (last !== undefined) {
        last = last._id;
    }
    Meteor.call('checkStatuses.insert', this._id, text, time, last);
}

Template.main.events({
    'submit .add-checkIn'(event) {
        event.preventDefault();
        insert("In");
    },
    'submit .add-checkOut'(event) {
        event.preventDefault();
        insert("Out");
    }
});

Template.checkStatus.events({
    'click .delete'() {
        if (confirm('Are You Sure?')) {
            Meteor.call('checkStatuses.remove', this._id);
        }
    },
    'click .toggle-private'() {
        Meteor.call('checkStatuses.setPrivate', this._id, !this.private);
    }
});

Template.checkStatus.helpers({
    isOwner() {
        return this.owner === Meteor.userId();
    }
});