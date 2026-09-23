// Lawzunction Client Document Vault Upload Utility (MERN Stack)

export const uploadFile = async (file, folder = 'documents') => {
  // Simulates secure cloud storage processing for documents
  await new Promise(resolve => setTimeout(resolve, 800));

  const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
  const fileExt = file.name.split('.').pop().toLowerCase();
  
  // Choose representative preview placeholder based on file type
  let previewUrl = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80';
  if (fileExt === 'pdf') {
    previewUrl = 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80';
  } else if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
    previewUrl = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80';
  }

  return {
    publicUrl: previewUrl,
    size: sizeStr,
    name: file.name,
    folder
  };
};

export default uploadFile;
