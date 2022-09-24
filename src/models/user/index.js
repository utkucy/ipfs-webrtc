import { observable, computed } from "mobx";
import { MeetingRecord, Participant } from "models/meetingRecord";
import { Settings } from "../settings";

export class User {
  @observable _id;
  @observable displayName;
  @observable email;
  @observable password;
  @observable settings;

  @observable contacts;
  @observable past_meetings;

  constructor(data = {}) {
    this._id = data._id;
    this.displayName = data.displayName;
    this.email = data.email;
    this.password = data.password;
    this.settings = data.settings ? new Settings(data.settings) : null;

    this.contacts = data.contacts
      ? data.contacts.map((c) => new Participant(c))
      : [];
    this.past_meetings = data.past_meetings
      ? data.past_meetings.map((pm) => new MeetingRecord(pm))
      : [];
  }
}
