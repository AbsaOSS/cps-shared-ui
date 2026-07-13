// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/config/primeng.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import type { ElementRef, TemplateRef } from '@angular/core';
import type { OverlayOptions, PassThroughOptions, Translation } from '../api/public_api';
import type { AccordionPassThrough } from '../types/accordion/public_api';
import type { AutoCompletePassThrough } from '../types/autocomplete/public_api';
import type { AvatarPassThrough } from '../types/avatar/public_api';
import type { AvatarGroupPassThrough } from '../types/avatargroup/public_api';
import type { BadgePassThrough } from '../types/badge/public_api';
import type { BlockUIPassThrough } from '../types/blockui/public_api';
import type { BreadcrumbPassThrough } from '../types/breadcrumb/public_api';
import type { ButtonPassThrough } from '../types/button/public_api';
import type { CardPassThrough } from '../types/card/public_api';
import type { CarouselPassThrough } from '../types/carousel/public_api';
import type { CascadeSelectPassThrough } from '../types/cascadeselect/public_api';
import type { CheckboxPassThrough } from '../types/checkbox/public_api';
import type { ChipPassThrough } from '../types/chip/public_api';
import type { ColorPickerPassThrough } from '../types/colorpicker/public_api';
import type { ConfirmDialogPassThrough } from '../types/confirmdialog/public_api';
import type { ConfirmPopupPassThrough } from '../types/confirmpopup/public_api';
import type { DialogPassThrough } from '../types/dialog/public_api';
import type { DividerPassThrough } from '../types/divider/public_api';
import type { DockPassThrough } from '../types/dock/public_api';
import type { DrawerPassThrough } from '../types/drawer/public_api';
import type { EditorPassThrough } from '../types/editor/public_api';
import type { FieldsetPassThrough } from '../types/fieldset/public_api';
import type { FileUploadPassThrough } from '../types/fileupload/public_api';
import type { FloatLabelPassThrough } from '../types/floatlabel/public_api';
import type { FluidPassThrough } from '../types/fluid/public_api';
import type { GalleriaPassThrough } from '../types/galleria/public_api';
import type { IconFieldPassThrough } from '../types/iconfield/public_api';
import type { IftaLabelPassThrough } from '../types/iftalabel/public_api';
import type { ImagePassThrough } from '../types/image/public_api';
import type { ImageComparePassThrough } from '../types/imagecompare/public_api';
import type { InplacePassThrough } from '../types/inplace/public_api';
import type { InputGroupPassThrough } from '../types/inputgroup/public_api';
import type { InputGroupAddonPassThrough } from '../types/inputgroupaddon/public_api';
import type { InputIconPassThrough } from '../types/inputicon/public_api';
import type { InputMaskPassThrough } from '../types/inputmask/public_api';
import type { InputNumberPassThrough } from '../types/inputnumber/public_api';
import type { InputOtpPassThrough } from '../types/inputotp/public_api';
import type { InputTextPassThrough } from '../types/inputtext/public_api';
import type { KnobPassThrough } from '../types/knob/public_api';
import type { MegaMenuPassThrough } from '../types/megamenu/public_api';
import type { MenuPassThrough } from '../types/menu/public_api';
import type { MenubarPassThrough } from '../types/menubar/public_api';
import type { MessagePassThrough } from '../types/message/public_api';
import type { MeterGroupPassThrough } from '../types/metergroup/public_api';
import type { OrderListPassThrough } from '../types/orderlist/public_api';
import type { OrganizationChartPassThrough } from '../types/organizationchart/public_api';
import type { OverlayBadgePassThrough } from '../types/overlaybadge/public_api';
import type { PanelPassThrough } from '../types/panel/public_api';
import type { PanelMenuPassThrough } from '../types/panelmenu/public_api';
import type { PopoverPassThrough } from '../types/popover/public_api';
import type { ProgressBarPassThrough } from '../types/progressbar/public_api';
import type { ProgressSpinnerPassThrough } from '../types/progressspinner/public_api';
import type { RadioButtonPassThrough } from '../types/radiobutton/public_api';
import type { RatingPassThrough } from '../types/rating/public_api';
import type { VirtualScrollerPassThrough } from '../types/scroller/public_api';
import type { ScrollPanelPassThrough } from '../types/scrollpanel/public_api';
import type { ScrollTopPassThrough } from '../types/scrolltop/public_api';
import type { SelectPassThrough } from '../types/select/public_api';
import type { SelectButtonPassThrough } from '../types/selectbutton/public_api';
import type { SkeletonPassThrough } from '../types/skeleton/public_api';
import type { SliderPassThrough } from '../types/slider/public_api';
import type { SpeedDialPassThrough } from '../types/speeddial/public_api';
import type { SplitButtonPassThrough } from '../types/splitbutton/public_api';
import type { SplitterPassThrough } from '../types/splitter/public_api';
import type { StepperPassThrough } from '../types/stepper/public_api';
import type { ColumnFilterPassThrough, TablePassThrough } from '../types/table/public_api';
import type { TabListPassThrough, TabPanelPassThrough, TabPanelsPassThrough, TabPassThrough, TabsPassThrough } from '../types/tabs/public_api';
import type { TagPassThrough } from '../types/tag/public_api';
import type { TerminalPassThrough } from '../types/terminal/public_api';
import type { TieredMenuPassThrough } from '../types/tieredmenu/public_api';
import type { TimelinePassThrough } from '../types/timeline/public_api';
import type { ToastPassThrough } from '../types/toast/public_api';
import type { ToggleButtonPassThrough } from '../types/togglebutton/public_api';
import type { ToggleSwitchPassThrough } from '../types/toggleswitch/public_api';
import type { ToolbarPassThrough } from '../types/toolbar/public_api';
import type { TreePassThrough } from '../types/tree/public_api';
import type { TreeSelectPassThrough } from '../types/treeselect/public_api';
import type { TreeTablePassThrough } from '../types/treetable/public_api';

/** ZIndex configuration */
export type ZIndex = {
    modal: number;
    overlay: number;
    menu: number;
    tooltip: number;
};

/** Theme configuration */
export type ThemeType = { preset?: any; options?: any } | 'none' | boolean | undefined;

export type ThemeConfigType = {
    theme?: ThemeType;
    csp?: {
        nonce: string | undefined;
    };
};

export interface GlobalPassThrough {
    accordion?: AccordionPassThrough;
    autoComplete?: AutoCompletePassThrough;
    avatar?: AvatarPassThrough;
    avatarGroup?: AvatarGroupPassThrough;
    blockUI?: BlockUIPassThrough;
    breadcrumb?: BreadcrumbPassThrough;
    card?: CardPassThrough;
    carousel?: CarouselPassThrough;
    cascadeSelect?: CascadeSelectPassThrough;
    checkbox?: CheckboxPassThrough;
    chip?: ChipPassThrough;
    colorPicker?: ColorPickerPassThrough;
    columnFilter?: ColumnFilterPassThrough;
    confirmDialog?: ConfirmDialogPassThrough;
    confirmPopup?: ConfirmPopupPassThrough;
    dialog?: DialogPassThrough;
    divider?: DividerPassThrough;
    dock?: DockPassThrough;
    megaMenu?: MegaMenuPassThrough;
    drawer?: DrawerPassThrough;
    editor?: EditorPassThrough;
    fileUpload?: FileUploadPassThrough;
    floatLabel?: FloatLabelPassThrough;
    menu?: MenuPassThrough;
    menubar?: MenubarPassThrough;
    fluid?: FluidPassThrough;
    galleria?: GalleriaPassThrough;
    iconField?: IconFieldPassThrough;
    iftaLabel?: IftaLabelPassThrough;
    inputIcon?: InputIconPassThrough;
    image?: ImagePassThrough;
    imageCompare?: ImageComparePassThrough;
    inplace?: InplacePassThrough;
    inputText?: InputTextPassThrough;
    inputGroup?: InputGroupPassThrough;
    inputGroupAddon?: InputGroupAddonPassThrough;
    inputMask?: InputMaskPassThrough;
    inputNumber?: InputNumberPassThrough;
    inputOtp?: InputOtpPassThrough;
    knob?: KnobPassThrough;
    popover?: PopoverPassThrough;
    message?: MessagePassThrough;
    meterGroup?: MeterGroupPassThrough;
    orderList?: OrderListPassThrough;
    organizationChart?: OrganizationChartPassThrough;
    overlayBadge?: OverlayBadgePassThrough;
    progressBar?: ProgressBarPassThrough;
    progressSpinner?: ProgressSpinnerPassThrough;
    radioButton?: RadioButtonPassThrough;
    rating?: RatingPassThrough;
    virtualScroller?: VirtualScrollerPassThrough;
    scrollPanel?: ScrollPanelPassThrough;
    scrollTop?: ScrollTopPassThrough;
    select?: SelectPassThrough;
    selectButton?: SelectButtonPassThrough;
    skeleton?: SkeletonPassThrough;
    slider?: SliderPassThrough;
    speedDial?: SpeedDialPassThrough;
    splitButton?: SplitButtonPassThrough;
    splitter?: SplitterPassThrough;
    stepper?: StepperPassThrough;
    tabs?: TabsPassThrough;
    tab?: TabPassThrough;
    tabList?: TabListPassThrough;
    tabPanel?: TabPanelPassThrough;
    tabPanels?: TabPanelsPassThrough;
    table?: TablePassThrough;
    tieredMenu?: TieredMenuPassThrough;
    timeline?: TimelinePassThrough;
    tag?: TagPassThrough;
    terminal?: TerminalPassThrough;
    toast?: ToastPassThrough;
    toggleButton?: ToggleButtonPassThrough;
    toggleSwitch?: ToggleSwitchPassThrough;
    toolbar?: ToolbarPassThrough;
    tree?: TreePassThrough;
    treeSelect?: TreeSelectPassThrough;
    treeTable?: TreeTablePassThrough;
    panel?: PanelPassThrough;
    panelMenu?: PanelMenuPassThrough;
    button?: ButtonPassThrough;
    badge?: BadgePassThrough;
    fieldset?: FieldsetPassThrough;
    global?: {
        css?: string;
    };
    [key: string]: any;
}

export type PrimeNGConfigType = {
    ripple?: boolean;
    overlayAppendTo?: HTMLElement | ElementRef | TemplateRef<any> | string | null | undefined | any;
    /**
     * @deprecated Since v20. Use `inputVariant` instead.
     */
    inputStyle?: 'outlined' | 'filled';
    inputVariant?: 'outlined' | 'filled';
    overlayOptions?: OverlayOptions;
    translation?: Translation;
    /**
     * @experimental
     * This property is not yet implemented. It will be available in a future release.
     */
    unstyled?: boolean;
    zIndex?: ZIndex | null | undefined;
    pt?: GlobalPassThrough | null | undefined;
    ptOptions?: PassThroughOptions | null | undefined;
    filterMatchModeOptions?: any;
} & ThemeConfigType;
