import { observable, computed } from "mobx";
import moment from "moment";

export class MeetingRecord {
  @observable host_displayName;
  @observable meeting_id;
  @observable createdAt;
  @observable finishedAt;
  @observable date;
  @observable participant_list = [];

  constructor(data = {}) {
    this.host_displayName = data.host_displayName;
    this.meeting_id = data.meeting_id;
    this.createdAt = moment(data.createdAt).format();
    this.finishedAt = moment(data.finishedAt).format();
    this.date = moment(data.createdAt)
      .format(" H:mm -")
      .concat(moment(data.finishedAt).format("H:mm / D MMMM, YYYY"));
    this.participant_list = data.participant_list.map(
      (p) => new Participant(p)
    );
  }
}

export class Participant {
  @observable displayName;
  @observable uid;
  @observable email;
  @observable socketID;

  constructor(data = {}) {
    this.displayName = data.displayName;
    this.uid = data.uid;
    this.email = data.email;
    this.socketID = data.socketID;
  }
}
