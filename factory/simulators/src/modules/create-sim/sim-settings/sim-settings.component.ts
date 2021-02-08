import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { SimulatorsServiceService } from "../../../services/simulatorsService.service";
import { SimulatorSettingsService } from "@services/simulatorSettings.service";
@Component({
  selector: "app-sim-settings",
  templateUrl: "./sim-settings.component.html",
  styleUrls: ["./sim-settings.component.scss"],
})
export class SimSettingsComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private simService: SimulatorsServiceService,
    private simSettings: SimulatorSettingsService,
  ) {}

  resultTemplate = { commandQueue: [], name: "" };

  newFragmentAdded = false;
  alarms: {
    level?: string;
    alarmType: string;
    alarmText: string;
    steps?: string;
  }[] = [];

  alarmConfig = [
    "Generate repeated alarms",
    "Alternate measurements with alarms",
  ];
  
  selectedAlarmConfig: string = this.alarmConfig[0];

  randomSelected = false;
  simulatorName: string;
  currentIndex: number;
  insertIndex: number;
  toAddMsmtOrSleep = false;
  toDisplay = false;
  defaultConfig: string[] = ["Measurements", "Alarms", "Events", "Sleep"];
  selectedConfig: string = this.defaultConfig[0];


  onChangeConfig(val) {
    this.selectedConfig = val;
  }

  ngOnInit() {
    // this.mo.c8y_DeviceSimulator.id = this.mo.id;
  }


}
