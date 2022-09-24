import { observable, computed } from "mobx";

export class Settings {
  @observable confirm_leave_meeting;
  @observable copy_invite_link;
  @observable show_meeting_duration;
  @observable turn_of_media_devices;

  constructor(data = {}) {
    this.confirm_leave_meeting = data.confirm_leave_meeting;
    this.copy_invite_link = data.copy_invite_link;
    this.show_meeting_duration = data.show_meeting_duration;
    this.turn_of_media_devices = data.turn_of_media_devices;
  }
}
