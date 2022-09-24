import { observable, computed } from "mobx";
import { Participant } from "models/meetingRecord";

export class Room {
  @observable createdAt;
  @observable host_displayName;
  @observable host_id;
  @observable room_id;
  @observable room_password;

  @observable participant_list: Participant[];
  @observable current_participant_list: Participant[];

  constructor(data = {}) {
    this.createdAt = data.createdAt;
    this.host_displayName = data.host_displayName;
    this.host_id = data.host_id;
    this.room_id = data.room_id;
    this.room_password = data.room_password;

    this.participant_list = data.participant_list
      ? data.participant_list.map((p) => new Participant(p))
      : [];
    this.current_participant_list = data.current_participant_list
      ? data.current_participant_list.map((p) => new Participant(p))
      : [];
  }
}
