import React, { useState } from 'react';
import { Alert } from 'react-bootstrap';

const Message = ({ variant, dismissible, children }) => {
  const [show, setShow] = useState(true);
  if (show)
    return (
      <Alert
        variant={variant}
        onClose={() => setShow(false)}
        dismissible={dismissible}
      >
        {children}
      </Alert>
    );
  else return <> </>;
};

Message.defaultProps = {
  variant: 'info',
  dismissible: true
};

export default Message;
