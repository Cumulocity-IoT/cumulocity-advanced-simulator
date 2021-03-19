import { Component, Input, OnInit, TemplateRef } from "@angular/core";
import { CommandQueueEntry } from "@models/commandQueue.model";
import {
  AlarmInstruction,
  BasicEventInstruction,
  EventInstruction,
  InstructionCategory,
  SeriesInstruction,
  SeriesMeasurementInstruction,
  SleepInstruction,
  SmartRestInstruction,
} from "@models/instruction.model";
import {
  SeriesMeasurementsForm,
  SeriesAlarmsForm,
  SeriesBasicEventsForm,
  SeriesEventsForm,
  SeriesSleepForm,
} from "@models/inputFields.const";
import { InstructionService } from "@services/Instruction.service";

@Component({
  selector: "app-series-item",
  templateUrl: "./series-item.component.html",
  styleUrls: ["./series-item.component.less"],
})
export class SeriesItemComponent implements OnInit {
  selectedSeries: SeriesInstruction;
  selectedConfig: string;
  instructionValue: SeriesInstruction;
  isSmartRestSelected = false;
  smartRestSelectedConfig;
  smartRestInstruction;
  form;
  icon: string;

  @Input() header: TemplateRef<any>;
  @Input() isExpanded: boolean;

  @Input() smartRestConfig;
  @Input() id;

  @Input() set series(value: SeriesInstruction) {
    this.selectedSeries = value;
    this.selectedConfig = this.selectedSeries.type;    
    this.instructionValue = value;
    this.setLabelsForSelected(); 
  }

  get series() {
    return this.selectedSeries;
  }

  @Input() commandQueue: CommandQueueEntry[];
  @Input() mo;
  constructor(private instructionService: InstructionService) {}

  ngOnInit() {}

  setLabelsForSelected() {
    switch (this.selectedSeries.type) {
      case "Measurement":
        this.icon = 'sliders';
        this.form = SeriesMeasurementsForm;
        break;
      case "Alarm":
        this.icon = 'bell-o';
        this.form = SeriesAlarmsForm;
        break;
      case "Sleep":
        this.icon = 'clock-o';
        this.form = SeriesSleepForm;
        break;
      case "BasicEvent":
        this.icon = 'tasks';
        this.form = SeriesBasicEventsForm;
        break;
      case "LocationUpdateEvent":
        this.icon = 'globe';
        this.form = SeriesEventsForm;
        break;
      case "SmartRest":
        this.icon = "sitemap";
        this.smartRestSelectedConfig = this.selectedSeries.config;
        this.smartRestInstruction = this.selectedSeries.instruction;
        this.form = this.instructionService.createSmartRestDynamicForm(this.smartRestInstruction);
        break;
    }
  }
}
