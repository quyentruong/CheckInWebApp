import {Mongo} from 'meteor/mongo';

export const CheckStatus = new Mongo.Collection('checkStatuses');
export const publicStatus = new Mongo.Collection('publicStatus');