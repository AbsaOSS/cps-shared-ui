import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  CpsInputComponent,
  CpsNotificationPosition,
  CpsNotificationService,
  getCpsColors,
  getTextColor
} from 'cps-ui-kit';

type colorGroupsType = {
  name: string;
  colors: { name: string; value: string }[][];
}[];

@Component({
  standalone: true,
  imports: [CpsInputComponent, CommonModule],
  selector: 'app-colors-page',
  templateUrl: './colors-page.component.html',
  styleUrls: ['./colors-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ColorsPageComponent implements OnInit {
  colorsList: colorGroupsType = [
    {
      name: 'Main',
      colors: [[], [], [], [], [], [], [], [], [], [], [], [], []]
    },
    { name: 'Darks', colors: [[], [], []] },
    { name: 'States', colors: [[], [], [], [], [], [], [], []] },
    { name: 'Highlights', colors: [[], [], [], []] },
    { name: 'Backgrounds', colors: [[], [], [], []] },
    { name: 'Lines', colors: [[], [], [], []] },
    { name: 'Text', colors: [[], [], [], [], []] }
  ];

  filteredColorsList: colorGroupsType = [
    {
      name: 'Main',
      colors: [[], [], [], [], [], [], [], [], [], [], [], [], []]
    },
    { name: 'Darks', colors: [[], [], []] },
    { name: 'States', colors: [[], [], [], [], [], [], [], []] },
    { name: 'Highlights', colors: [[], [], [], []] },
    { name: 'Backgrounds', colors: [[], [], [], []] },
    { name: 'Lines', colors: [[], [], [], []] },
    { name: 'Text', colors: [[], [], [], [], []] }
  ];

  colorNameColor: { [key: string]: string } = {};

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _notificationService: CpsNotificationService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    const customColors = getCpsColors(this.document);
    customColors.forEach((clr) => {
      const name = clr[0].replace(/^--cps-color-/, '');
      const value = clr[1];

      this.colorNameColor[value] = getTextColor(value);

      if (name.startsWith('energy')) {
        this.colorsList[0].colors[0].push({ name, value });
      } else if (name.startsWith('prepared')) {
        this.colorsList[0].colors[1].push({ name, value });
      } else if (name.startsWith('agile')) {
        this.colorsList[0].colors[2].push({ name, value });
      } else if (name.startsWith('passion')) {
        this.colorsList[0].colors[3].push({ name, value });
      } else if (name.startsWith('warmth')) {
        this.colorsList[0].colors[4].push({ name, value });
      } else if (name.startsWith('human')) {
        this.colorsList[0].colors[5].push({ name, value });
      } else if (name.startsWith('grounded')) {
        this.colorsList[0].colors[6].push({ name, value });
      } else if (name.startsWith('care')) {
        this.colorsList[0].colors[7].push({ name, value });
      } else if (name.startsWith('smile')) {
        this.colorsList[0].colors[8].push({ name, value });
      } else if (name.startsWith('surprise')) {
        this.colorsList[0].colors[9].push({ name, value });
      } else if (name.startsWith('calm')) {
        this.colorsList[0].colors[10].push({ name, value });
      } else if (name.startsWith('luxury')) {
        this.colorsList[0].colors[11].push({ name, value });
      } else if (name.startsWith('depth')) {
        this.colorsList[0].colors[12].push({ name, value });
      } else if (name.startsWith('silver')) {
        this.colorsList[1].colors[0].push({ name, value });
      } else if (name.startsWith('platinum')) {
        this.colorsList[1].colors[1].push({ name, value });
      } else if (name.startsWith('graphite')) {
        this.colorsList[1].colors[2].push({ name, value });
      } else if (name === 'info-bg') {
        this.colorsList[2].colors[4].push({ name, value });
      } else if (name === 'success-bg') {
        this.colorsList[2].colors[5].push({ name, value });
      } else if (name === 'warn-bg') {
        this.colorsList[2].colors[6].push({ name, value });
      } else if (name === 'error-bg') {
        this.colorsList[2].colors[7].push({ name, value });
      } else if (name.startsWith('info')) {
        this.colorsList[2].colors[0].push({ name, value });
      } else if (name.startsWith('success')) {
        this.colorsList[2].colors[1].push({ name, value });
      } else if (name.startsWith('warn')) {
        this.colorsList[2].colors[2].push({ name, value });
      } else if (name.startsWith('error')) {
        this.colorsList[2].colors[3].push({ name, value });
      } else if (name === 'highlight-hover') {
        this.colorsList[3].colors[0].push({ name, value });
      } else if (name === 'highlight-active') {
        this.colorsList[3].colors[1].push({ name, value });
      } else if (name === 'highlight-selected') {
        this.colorsList[3].colors[2].push({ name, value });
      } else if (name === 'highlight-selected-dark') {
        this.colorsList[3].colors[3].push({ name, value });
      } else if (name === 'bg-lightest') {
        this.colorsList[4].colors[0].push({ name, value });
      } else if (name === 'bg-light') {
        this.colorsList[4].colors[1].push({ name, value });
      } else if (name === 'bg-mid') {
        this.colorsList[4].colors[2].push({ name, value });
      } else if (name === 'bg-dark') {
        this.colorsList[4].colors[3].push({ name, value });
      } else if (name === 'line-light') {
        this.colorsList[5].colors[0].push({ name, value });
      } else if (name === 'line-mid') {
        this.colorsList[5].colors[1].push({ name, value });
      } else if (name === 'line-dark') {
        this.colorsList[5].colors[2].push({ name, value });
      } else if (name === 'line-darkest') {
        this.colorsList[5].colors[3].push({ name, value });
      } else if (name === 'text-lightest') {
        this.colorsList[6].colors[0].push({ name, value });
      } else if (name === 'text-light') {
        this.colorsList[6].colors[1].push({ name, value });
      } else if (name === 'text-mild') {
        this.colorsList[6].colors[2].push({ name, value });
      } else if (name === 'text-dark') {
        this.colorsList[6].colors[3].push({ name, value });
      } else if (name === 'text-darkest') {
        this.colorsList[6].colors[4].push({ name, value });
      }
    });

    this.filteredColorsList = [...this.colorsList];
  }

  onSearchChanged(value: string) {
    this._filterColors(value);
  }

  private _filterColors(searchStr: string) {
    searchStr = searchStr.toLowerCase();

    const filteredList: colorGroupsType = [];

    for (let i = 0; i < this.colorsList.length; i++) {
      const group = this.colorsList[i];
      if (group.name.toLowerCase().includes(searchStr)) {
        filteredList.push(group);
      } else {
        const colors = group.colors.filter((subgroup) => {
          const res = subgroup.some(
            (clr) =>
              clr.name.toLowerCase().includes(searchStr) ||
              clr.value.toLowerCase().includes(searchStr)
          );
          return res;
        });
        if (colors.length > 0) {
          filteredList.push({ name: group.name, colors });
        }
      }
    }

    this.filteredColorsList = filteredList;
  }

  onCopyColor(color: string) {
    navigator.clipboard.writeText(color).then(
      () => {
        this._notificationService.success(
          `Color ${color} copied to clipboard`,
          undefined,
          { position: CpsNotificationPosition.BOTTOM, timeout: 1000 }
        );
      },
      () => {
        this._notificationService.error(
          'Failed to copy color to clickboard',
          undefined,
          {
            position: CpsNotificationPosition.BOTTOM,
            timeout: 1000
          }
        );
      }
    );
  }
}
