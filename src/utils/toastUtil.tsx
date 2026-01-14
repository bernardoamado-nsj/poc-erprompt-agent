import { toast } from 'react-toastify';

export function toastError(title: string, message: string) {
  toast.error(
    <div>
      <h3>{title}</h3>
      <div style={{ height: ".5rem" }}></div>
      <span>{message}</span>
    </div>,
    {
      position: "top-center",
      className: "toast error-toast",
      icon: false,
      hideProgressBar: true,
      autoClose: false,
    }
  );
}