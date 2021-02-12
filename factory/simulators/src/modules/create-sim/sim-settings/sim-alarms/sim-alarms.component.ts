import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AlarmsService } from "@services/alarms.service";
import { SimulatorSettingsService } from "@services/simulatorSettings.service";

@Component({
  selector: "app-sim-alarms",
  templateUrl: "./sim-alarms.component.html",
  styleUrls: ["./sim-alarms.component.scss"],
})
export class SimAlarmsComponent implements OnInit {
  selectedAlarm;
  isNotFirst = false;
  selectedButton = "Add Alarm";
  @Input() set seriesVal(val) {
    if (val !== undefined && val.alarmType !== undefined) {
      console.log("val alarm");
      console.log(val);
      this.selectedAlarm = val;
      this.isNotFirst = true;
      this.alarmType = val.alarmType;
      this.alarmText = val.alarmText;
      this.alarmSteps = val.alarmSteps;
      this.alarmSleep = val.alarmSleep;
      this.selectedAlarmConfig = val.alarmConfig;
      this.selectedAlarmCategory = this.alarmCategories.filter((x) => x.code === val.level)[0].category;
      this.selectedButton = "Duplicate Alarm";
    }
  }
  get seriesVal() {
    return this.selectedAlarm;
  }
  @Output() alarmEmitter = new EventEmitter();
  alarmCategories = [
    { category: "Critical", code: "301" },
    { category: "Major", code: "302" },
    { category: "Minor", code: "303" },
  ];
  selectedAlarmCategory = this.alarmCategories[0].category;

  alarmConfig = [
    "Generate repeated alarms",
    "Alternate measurements with alarms",
  ];
  selectedAlarmConfig: string = this.alarmConfig[0];

  alarmType: string;
  alarmText: string;
  alarmSteps: string;
  alarmSleep: string;
  alarms = [];
  currentAlarm: {
    level: string;
    alarmType: string;
    alarmText: string;
    alarmSteps: string;
    alarmSleep?: string;
    alarmConfig: string;
  };
  constructor(
    private service: AlarmsService,
    private simService: SimulatorSettingsService
  ) {}

  ngOnInit() {}

  onChangeOfAlarmConfig(val) {
    this.selectedAlarmConfig = val;
    this.service.selectedAlarmConfig = this.selectedAlarmConfig;
  }

  onChangeOfAlarm(val) {
    this.selectedAlarmCategory = val;
    this.service.selectedAlarmCategory = this.selectedAlarmCategory;
  }

  addAlarmToArray() {
    for (let i = 0; i < parseInt(this.alarmSteps); i++) {
      const level = this.alarmCategories.find(
        (entry) => entry.category === this.selectedAlarmCategory
      ).code;
      this.currentAlarm = {
        level: level,
        alarmType: this.alarmType,
        alarmText: this.alarmText,
        alarmSteps: this.alarmSteps,
        alarmSleep: this.alarmSleep,
        alarmConfig: this.selectedAlarmConfig,
      };
      this.service.alarms.push(this.currentAlarm);
    }
    this.simService.allSeries.push(this.currentAlarm);
    this.alarmText = "";
    this.alarmType = "";
    this.alarmSteps = "";
  }
}
