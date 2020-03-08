export interface ExportOptionsProp {
  type: 'prop';
  key: string;
  xmlKey: string;
}

export interface ExportOptionsCalculation {
  type: 'tedarikci' | 'platform' | 'pazaryeri';
  key: string;
  xmlKey: string;
  selectedName?: string;
}

export type ExportOptions = [ExportOptionsProp[], ExportOptionsCalculation[]];
