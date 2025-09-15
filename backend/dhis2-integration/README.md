# DHIS2 Integration

This project provides integration between your backend system and [DHIS2](https://www.dhis2.org/), enabling seamless data exchange and synchronization for health information management.

## Features

- Connects to DHIS2 API for data import/export
- Supports authentication and secure communication
- Handles DHIS2 data models (organisation units, data elements, events, etc.)
- Error handling and logging
- Configurable endpoints and credentials

## Prerequisites

- Node.js (v14+ recommended)
- DHIS2 instance with API access
- Environment variables configured for DHIS2 credentials

## Installation

```bash
git clone https://github.com/your-org/dhis2-integration.git
cd dhis2-integration
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
DHIS2_BASE_URL=https://your-dhis2-instance.org
DHIS2_USERNAME=your-username
DHIS2_PASSWORD=your-password
```

## Usage

### Import Data from DHIS2

```js
const dhis2 = require('./dhis2');
dhis2.importData('dataElement', { params });
```

### Export Data to DHIS2

```js
const dhis2 = require('./dhis2');
dhis2.exportData('event', { payload });
```

## API Reference

- `importData(type, options)` - Imports data of specified type from DHIS2
- `exportData(type, payload)` - Exports data to DHIS2
- `getOrganisationUnits()` - Retrieves organisation units
- `getDataElements()` - Retrieves data elements

## Error Handling

All API calls return Promises. Errors are logged and can be handled using `.catch()`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a pull request

## License

This project is licensed under the MIT License.

## Contact

For support or inquiries, please contact [your-email@example.com](mailto:your-email@example.com).