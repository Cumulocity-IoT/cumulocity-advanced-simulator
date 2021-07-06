import { Component, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { IManagedObject } from '@c8y/client';
import { C8YDeviceSimulator, CustomSimulator } from '@models/simulator.model';
import { TemplateModel } from '@models/template.model';
import { SimulatorsBackendService } from '@services/simulatorsBackend.service';
import { AdditionalParameter } from '@models/commandQueue.model';
import { SeriesInstruction } from '@models/instruction.model';

export interface ILabels {
  ok?: string;
  cancel?: string;
}

@Component({
  selector: 'template-selection-dialog',
  template: ` <c8y-modal
    title="{{ modalTitle }}"
    (onClose)="createBulkSimulatorsFromTemplate($event)"
    (onDismiss)="onDismiss($event)"
    [labels]="labels"
  >
    <ng-form>
      <div class="form-group">
        <br />
        <label translate>Select from saved templates *</label>
        <select
          class="form-control select-config"
          [(ngModel)]="simulatorTemplate"
          (ngModelChange)="onChange($event)"
          [ngModelOptions]="{ standalone: true }"
        >
          <option value="" disabled selected>Select from simulator templates</option>
          <option *ngFor="let first of allSimulatorTemplates" [ngValue]="first">{{ first.name }}</option>
        </select>

        <br />
        <label translate>Select number of instances * </label>
        <input
          type="text"
          class="form-control"
          [(ngModel)]="instances"
          (ngModelChange)="onChangeInstances($event)"
          [ngModelOptions]="{ standalone: true }"
        />
        <br />
        <label translate>Simulator title prefix</label>
        <input
          class="form-control"
          placeholder="(Optional)"
          [(ngModel)]="simulatorTitle"
          [ngModelOptions]="{ standalone: true }"
        />
      </div>
    </ng-form>
  </c8y-modal>`
})
export class TemplateSelectionDialog implements OnInit {
  private closeSubject: Subject<any> = new Subject();

  public labels: ILabels = {
    ok: 'Create simulators from template',
    cancel: 'Cancel'
  };
  public modalTitle = 'Choose from existing templates to create simulators';

  deviceSimulator: C8YDeviceSimulator;
  simulatorTemplate: TemplateModel;
  simulatorTitle: string;
  @Input() allSimulatorTemplates: IManagedObject[];
  instances = 1;
  constructor(
    private backendService: SimulatorsBackendService
  ) {}

  ngOnInit() {
    this.simulatorTitle = this.simulatorTemplate.c8y_Template.c8y_DeviceSimulator.name;
  }

  onDismiss(event) {
    this.closeSubject.next(undefined);
  }

  onClose(event) {
    this.closeSubject.next(event);
  }

  onChange(simulator) {
    this.simulatorTemplate = simulator as TemplateModel;
  }

  onChangeInstances(newVal): void {
    this.instances = newVal;
  }

  async createBulkSimulatorsFromTemplate(event) {
    const templateId = this.simulatorTemplate.id;
    const { id, ...deviceSimulator } = this.simulatorTemplate.c8y_Template.c8y_DeviceSimulator;
    const additionals = this.simulatorTemplate.c8y_Template.c8y_additionals;
    const series = this.simulatorTemplate.c8y_Template.c8y_Series;
    const promiseArray = new Array<Promise<void>>();
    for (let i = 0; i < this.instances; i++) {
      promiseArray.push(this.createSimulatorInstanceFromTemplate(templateId, deviceSimulator, i, additionals, series));
    }
    await Promise.all(promiseArray);
  }

  async createSimulatorInstanceFromTemplate(
    id: string,
    deviceSimulator,
    index: number,
    additionals: AdditionalParameter[],
    series: SeriesInstruction[]
  ) {
    deviceSimulator.name = this.simulatorTitle
      ? `${this.simulatorTitle}_#${index}`
      : `${this.simulatorTemplate.name}_#${index}`;
    const createdSimulator = await this.backendService.createSimulator(deviceSimulator);
    const simulator: Partial<CustomSimulator> = {
      type: 'c8y_DeviceSimulator',
      owner: 'service_device-simulator',
      name: deviceSimulator.name,
      c8y_CustomSim: {},
      id: createdSimulator.id,
      c8y_DeviceSimulator: deviceSimulator,
      c8y_additionals: additionals,
      c8y_Series: series,
      c8y_hasTemplate: true,
      c8y_TemplateId: id
    };

    await this.backendService.addCustomSimulatorProperties(simulator);
  }
}
