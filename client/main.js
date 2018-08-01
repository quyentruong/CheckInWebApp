import {Template} from 'meteor/templating';
import {CheckStatus, publicStatus} from "../lib/collections";
import {Accounts} from 'meteor/accounts-base';
import './main.html';
import {Meteor} from "meteor/meteor";
import {ReactiveVar} from 'meteor/reactive-var';

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
});


Template.main.onCreated(function mainOnCreated() {
    Meteor.subscribe('checkStatuses');
    Meteor.subscribe('publicStatuses');
    this.date = new ReactiveVar(moment().format("MM/DD/YYYY"));
});


Template.main.helpers({
    ownerStatuses() {
        return CheckStatus.find({
            owner: Meteor.userId(),
            time: {$regex: Template.instance().date.get().split(" ")[0]}
        }, {sort: {createdAt: -1}});
    },
    publicS() {
        return publicStatus.find({time: {$regex: Template.instance().date.get().split(" ")[0]}}, {sort: {createdAt: -1}});
    }

});

Template.currentStatus.helpers({
    getCurrentStatus() {
        const last = CheckStatus.findOne({owner: Meteor.userId()}, {
            fields: {_id: 1, text: 1},
            sort: {createdAt: -1},
            limit: 1
        });
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
    const time = moment().add(1, "day").format("MM/DD/YYYY HH:mm:ss");
    // let last = CheckStatus.findOne({owner: Meteor.userId()}, {fields: {_id: 1}, sort: {createdAt: -1}, limit: 1});
    // if (last !== undefined) {
    //     last = last._id;
    // }
    Meteor.call('checkStatuses.insert', this._id, text, time);
    Meteor.call('publicStatuses.insert', this._id, text, time);
}

Template.main.events({
    'submit .add-checkIn'(event) {
        event.preventDefault();
        insert("In");
    },
    'submit .add-checkOut'(event) {
        event.preventDefault();
        insert("Out");
    },
    'submit .filter'(event, instance) {
        event.preventDefault();
        let d = event.target.date.value;
        instance.date.set(d);
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

Template.main.rendered = function () {
    Tracker.autorun(() => {
        let first = null, last = null;
        if (Meteor.userId()) {
            first = CheckStatus.findOne({owner: Meteor.userId()}, {
                fields: {time: 1},
                sort: {createdAt: 1},
                limit: 1
            });
            last = CheckStatus.findOne({owner: Meteor.userId()}, {
                fields: {time: 1},
                sort: {createdAt: -1},
                limit: 1
            });
        } else {
            first = publicStatus.findOne({}, {
                fields: {time: 1},
                sort: {createdAt: 1},
                limit: 1
            });
            last = publicStatus.findOne({}, {
                fields: {time: 1},
                sort: {createdAt: -1},
                limit: 1
            });
        }
        if (first && last) {
            this.$('.datepicker').datepicker({
                startDate: first.time.split(" ")[0],
                endDate: last.time.split(" ")[0],
                todayHighlight: true
            });
        }
    });


    this.$('.datepicker').val(moment().format("MM/DD/YYYY"));

};