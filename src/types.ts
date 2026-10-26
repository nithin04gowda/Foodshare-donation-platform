export interface LocationOption {
  name: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export const INDIAN_LOCATIONS: LocationOption[] = [
  {
    name: 'Koramangala, Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    latitude: 12.9352,
    longitude: 77.6245,
  },
  {
    name: 'Indiranagar, Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    latitude: 12.9784,
    longitude: 77.6408,
  },
  {
    name: 'MG Road, Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    latitude: 12.9756,
    longitude: 77.6066,
  },
  {
    name: 'Connaught Place, New Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6315,
    longitude: 77.2167,
  },
  {
    name: 'Andheri West, Mumbai',
    state: 'Maharashtra',
    pincode: '400058',
    latitude: 19.1363,
    longitude: 72.8277,
  },
  {
    name: 'Bandra West, Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    latitude: 19.0596,
    longitude: 72.8295,
  },
  {
    name: 'Hitec City, Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    latitude: 17.4435,
    longitude: 78.3772,
  },
  {
    name: 'T. Nagar, Chennai',
    state: 'Tamil Nadu',
    pincode: '600017',
    latitude: 13.0418,
    longitude: 80.2341,
  },
  {
    name: 'Shivajinagar, Pune',
    state: 'Maharashtra',
    pincode: '411005',
    latitude: 18.5314,
    longitude: 73.8446,
  },
];

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Chandigarh',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
];
