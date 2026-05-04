export const validate = (dto) => (req, res, next) => { 
  const { error } = dto.validate(req.body); 
  if (error) return res.status(400).json({ error: error.details }); 
  next(); 
};