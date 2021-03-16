import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Alert, AlertService } from "@c8y/ngx-components";
import { AlarmService, IdentityService } from "@c8y/ngx-components/api";
import { CommandQueueEntry } from "@models/commandQueue.model";
import { AlarmsService } from "@services/alarms.service";
import { InstructionService } from "@services/Instruction.service";
import { MeasurementsService } from "@services/measurements.service";
import { SimulatorSettingsService } from "@services/simulatorSettings.service";
import { SimulatorsServiceService } from "@services/simulatorsService.service";
import { UpdateInstructionsService } from "@services/updateInstructions.service";
import { isEqual } from "lodash";
@Component({
  selector: "app-create-sim",
  templateUrl: "./create-sim.component.html",
  styleUrls: ["./create-sim.component.less"],
})
export class CreateSimComponent implements OnInit {
  readyToStartSimulator = false;
  allInstructionsSeries = [];
  alarmSeries = [];
  smartRestConfig = [];
  commandQueue: CommandQueueEntry[] = [];
  data;
  mo;
  isExpanded = false;

  viewNewSeries = false;
  viewHistoricalSeries = false;
  actionButtons = ["New Series", "Existing series"];
  displayEditView = false;
  currentSelection: string = this.actionButtons[0];
  displayInstructionsView = false;
  editedVal;
  editedValue;
  deletedMeasurement;
  simulatorTitle: string;
  invalidSimulator = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private simSettings: SimulatorSettingsService,
    private measurementsService: MeasurementsService,
    private alarmService: AlarmsService,
    private simService: SimulatorsServiceService,
    private updateInstructionsService: UpdateInstructionsService,
    private instructionsService: InstructionService,
    private alertService: AlertService
  ) {}

  getCurrentSimulatorState(event: boolean) {
    this.invalidSimulator = event;
  }
  getCurrentValue(event) {
    this.editedValue = event;
  }
  changeRouteLastSite() {
    this.router.navigate(["/"]);
  }
  ngOnInit() {
    this.data = this.route.snapshot.data;
    this.mo = this.data.simulator.data;
    this.simulatorTitle = this.mo.c8y_DeviceSimulator.name;
    this.commandQueue = this.mo.c8y_DeviceSimulator.commandQueue;
    this.simSettings.setCommandQueue(this.commandQueue);

    this.updateInstructionsService.catDeleteMeasurement.subscribe((data) => {
      this.deletedMeasurement = data;
      this.deleteSeries(data);
    });

    this.simSettings.fetchAllSeries(this.mo).then((res) => {
      this.allInstructionsSeries = res.map((entry) => ({
        ...entry,
        active: false,
      }));
      console.log(this.allInstructionsSeries);
    });

    const filter = {
      withTotalPages: true,
      type: "c8y_SmartRest2Template",
      pageSize: 1000,
    };
    this.simService.getFilteredManagedObjects(filter).then((result) => {
      const temp = [];
      const ids = [];
      result.map((value) => {
        temp.push({
          values:
            value.com_cumulocity_model_smartrest_csv_CsvSmartRestTemplate
              .requestTemplates,
          templateId: value.id,
        });
      });

      const arrayOfPromises = [];
      temp.forEach((entry) => {
        const externalId = entry.templateId;
        arrayOfPromises.push(this.simService.fetchExternalIds(externalId));
      });
      Promise.all(arrayOfPromises).then((result) => {
        temp.forEach(
          (entry, index) =>
            (entry.templateId = result[index].data[0].externalId)
        );
        temp.forEach((entry) => {
          const template = entry.templateId;
          const smartRestValuesArray = entry.values;
          smartRestValuesArray.forEach((smartRestEntry) =>
            this.smartRestConfig.push({
              smartRestFields: smartRestEntry,
              templateId: template,
            })
          );
        });
        this.instructionsService.SmartRestArray = this.smartRestConfig;
      });
    });
  }

  updateViewState(val) {
    this.displayInstructionsView = val.instructionsView;
    this.editedVal = val.editedValue;
  }

  createSinusWave() {
    console.log("create sinuswave");
    for (let i = this.commandQueue.length - 1; i >= 0; i--) {
      this.commandQueue.push(this.commandQueue[i]);
    }
    this.simSettings.setCommandQueue(this.commandQueue);
  }

  delete(value) {
    var index = this.allInstructionsSeries.indexOf(value);
    if (index !== -1) {
      this.allInstructionsSeries.splice(index, 1);
    }
    console.log(this.allInstructionsSeries);
    this.mo.c8y_Series = this.allInstructionsSeries;
    this.simService.updateSimulatorManagedObject(this.mo).then((res) => {
      const alert = {
        text: `Instruction Series deleted successfully.`,
        type: "success",
      } as Alert;
      this.alertService.add(alert);
    }, (err) => {
      const alert = {
        text: `Instruction Series could not be deleted`,
        type: "danger",
      } as Alert;
      this.alertService.add(alert);
      
    });
  }

  deleteSeries(val) {
    if (val) {
      const minimumOfSeries = this.measurementsService.toMeasurementTemplate(
        val,
        val.minValue
      );
      const maximumOfSeries = this.measurementsService.toMeasurementTemplate(
        val,
        val.maxValue
      );
      const positionOfMinimum = this.commandQueue.findIndex((value) =>
        isEqual(value, minimumOfSeries)
      );
      const positionOfMaximum = this.commandQueue.findIndex((value) =>
        isEqual(value, maximumOfSeries)
      );
      this.commandQueue.splice(
        positionOfMinimum,
        positionOfMaximum - positionOfMinimum + 1
      );

      // TODO: add call to save to backend
    }
  }

  updateAllSeries(updatedAllInstructionsSeries) {
    this.allInstructionsSeries = updatedAllInstructionsSeries;
  }

  selectButton(item: string) {
    this.currentSelection = item;
    const activeElement = document.activeElement;
    if (activeElement && activeElement instanceof HTMLButtonElement) {
      activeElement.blur();
    }
    this.currentSelection === this.actionButtons[0]
      ? (this.viewNewSeries = true)
      : (this.viewNewSeries = false);
  }
}
