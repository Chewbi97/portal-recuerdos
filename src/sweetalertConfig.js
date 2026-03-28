import Swal from 'sweetalert2';

export const swalPortal = Swal.mixin({
  background: '#fdf6e3',
  color: '#3d2b1f',
  confirmButtonColor: '#7d2e2e',
  cancelButtonColor: 'transparent',
  customClass: {
    popup: 'swal-portal-popup',
    title: 'swal-portal-title',
    confirmButton: 'swal-portal-confirm',
    cancelButton: 'swal-portal-cancel',
  }
});