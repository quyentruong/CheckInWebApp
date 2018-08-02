import {Template} from 'meteor/templating';
import {CheckStatus, publicStatus} from "../lib/collections";
import {Accounts} from 'meteor/accounts-base';

import {ReactiveVar} from 'meteor/reactive-var';
import {Meteor} from "meteor/meteor";
import './main.html';

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
});


Template.main.onCreated(function mainOnCreated() {
    Meteor.subscribe('checkStatuses');
    Meteor.subscribe('publicStatuses');
    this.startdate = new ReactiveVar(moment().hour(0).minute(0).second(0).toDate());
    this.enddate = new ReactiveVar(moment().hour(23).minute(59).second(59).toDate());

    // console.log(Template.instance().startdate.get());
    // console.log(Template.instance().enddate.get());
});

Template.main.helpers({
    ownerStatuses() {
        return CheckStatus.find({
            owner: Meteor.userId(),
            createdAt: {
                '$gte': Template.instance().startdate.get(),
                '$lte': Template.instance().enddate.get()
            }
        }, {sort: {createdAt: -1}});
    },
    publicS() {
        return publicStatus.find({
            createdAt: {
                '$gte': Template.instance().startdate.get(),
                '$lte': Template.instance().enddate.get()
            }
        }, {sort: {createdAt: -1}});
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
            return last.text;
        }
    }
});

function insert(status) {
    let text = "In";
    if (status === "Out") {
        text = "Out";
    }
    const time = moment().format("MM/DD/YYYY HH:mm:ss");
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
        let date = event.target.daterange.value;
        date = date.split(" - ");
        instance.startdate.set(moment(date[0], 'MM/DD/YYYY').hour(0).minute(0).second(0).toDate());
        instance.enddate.set(moment(date[1], 'MM/DD/YYYY').hour(23).minute(59).second(59).toDate());
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

Template.main.rendered = () => {


    Tracker.autorun(() => {
        let first = null;
        if (Meteor.userId()) {
            first = CheckStatus.findOne({owner: Meteor.userId()}, {
                fields: {time: 1},
                sort: {createdAt: 1},
                limit: 1
            });
        } else {
            first = publicStatus.findOne({}, {
                fields: {time: 1},
                sort: {createdAt: 1},
                limit: 1
            });
        }
        if (first) {
            this.$('input[name="daterange"]').daterangepicker({
                "autoApply": true,
                ranges: {
                    'Today': [moment(), moment()],
                    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                    'This Month': [moment().startOf('month'), moment().endOf('month')],
                    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                },
                opens: 'left',
                minDate: first.time.split(" ")[0],
            }, function (start, end, label) {
                $("#filter").click();
                // console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.add(1, 'day').format('YYYY-MM-DD'));
            });

        }
    });


};