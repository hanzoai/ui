import { toast } from 'sonner';

export const submitRegistrationNoCodeNonPristineError = () => {
  return toast.error(
    <div>
      Your Hanzo Node is currently locked by existing keys, please restore your
      connection or reset your Hanzo Node Storage
    </div>,
    { position: 'bottom-center' },
  );
};

export const submitRegistrationNoCodeError = () => {
  return toast.error(<div>Error connecting to your Hanzo Node</div>, {
    position: 'bottom-center',
  });
};
