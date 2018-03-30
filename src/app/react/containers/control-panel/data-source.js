import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Alert, Spacing } from 'react-elemental';
import dottie from 'dottie';
import withResource from 'app/react/hoc/with-resource';
import DataSource from 'app/react/components/control-panel/data-source';
import {
  setUser,
  setDevice,
  setTimestampStart,
  setTimestampEnd,
} from 'app/redux/actions/data-source';
import { fetchLocations } from 'app/redux/actions/location';
import { dateToUnixTimestamp, unixTimestampToDate } from 'app/util/time';

/**
 * Container for controlling the value of parameters passed to the data source options in the
 * control panel.
 */
const DataSourceContainer = ({
  userDevices: { err, data = [] },
  user,
  timestamp,
  fieldWidth,
  handleUserChange,
  handleDeviceChange,
  handleTimestampStartChange,
  handleTimestampEndChange,
}) => {
  const users = data.map((entry) => entry.user);
  const devices = dottie.get(data.find((entry) => entry.user === user), 'devices', []);

  return (
    <div>
      {err && (
        <Spacing bottom>
          <Alert
            size="beta"
            type="error"
            title="There was an error fetching users and devices."
            message={err.message}
          />
        </Spacing>
      )}

      <Spacing bottom>
        <Alert
          size="beta"
          type="warn"
          title="Orion demo"
          message={'This is a demo instance of Orion, using static sample location data. ' +
          'For this reason, the accuracy filter and timestamp controls will not work.'}
        />
      </Spacing>

      <DataSource
        users={users}
        devices={devices}
        timestampStart={unixTimestampToDate(timestamp.start)}
        timestampEnd={unixTimestampToDate(timestamp.end)}
        fieldWidth={fieldWidth}
        onUserChange={handleUserChange}
        onDeviceChange={handleDeviceChange}
        onTimestampStartChange={handleTimestampStartChange}
        onTimestampEndChange={handleTimestampEndChange}
      />
    </div>
  );
};

DataSourceContainer.propTypes = {
  userDevices: PropTypes.shape({
    data: PropTypes.array,
  }).isRequired,
  user: PropTypes.string,
  timestamp: PropTypes.shape({
    start: PropTypes.number.isRequired,
    end: PropTypes.number.isRequired,
  }).isRequired,
  fieldWidth: PropTypes.number.isRequired,
  handleUserChange: PropTypes.func.isRequired,
  handleDeviceChange: PropTypes.func.isRequired,
  handleTimestampStartChange: PropTypes.func.isRequired,
  handleTimestampEndChange: PropTypes.func.isRequired,
};

DataSourceContainer.defaultProps = {
  user: null,
};

const mapStateToProps = ({ context, dataSource }) => ({
  fieldWidth: context.isCompact ? (context.width - 140) / 2 : 200,
  user: dataSource.user,
  timestamp: dataSource.timestamp,
});

const mapDispatchToProps = (dispatch) => {
  // Execute a location data fetch after every eligible parameter change
  const withLocationFetch = (func) => (actionCreator) => {
    const dispatcher = func(actionCreator);
    return (...args) => {
      dispatcher(...args);
      dispatch(fetchLocations());
      return dispatcher;
    };
  };

  // Only change SelectList values other than the placeholder
  const setSelectListValue = (func) => (value) => {
    if (value !== 'select-list-placeholder-item-value') {
      dispatch(func(value));
    }
  };

  // Wrapper around the timestamp setters that properly converts the input date to a timestamp
  const setTimestampValue = (func) => (evt) =>
    dispatch(func(dateToUnixTimestamp(evt.target.value)));

  return {
    handleUserChange: withLocationFetch(setSelectListValue)(setUser),
    handleDeviceChange: withLocationFetch(setSelectListValue)(setDevice),
    handleTimestampStartChange: withLocationFetch(setTimestampValue)(setTimestampStart),
    handleTimestampEndChange: withLocationFetch(setTimestampValue)(setTimestampEnd),
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withResource({
    key: 'userDevices',
    endpoint: 'api/users',
  }),
)(DataSourceContainer);